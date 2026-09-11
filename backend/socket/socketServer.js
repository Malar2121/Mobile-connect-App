const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const { notifyFamilyMembers, notifyUsers } = require('../services/notificationService');
const { resolveFamilyAccess } = require('../services/accessPolicy');
const { parseMentions, getMentionableMembers } = require('../controllers/chatController');
const { userRoom, familyRoom, publicAccess } = require('./familyRooms');
const logger = require('../utils/logger');

// Same wording and codes as the REST API, so the app handles both identically.
const ACCESS_MESSAGES = {
  NO_FAMILY: 'You must belong to a family to use chat.',
  CONSENT_PENDING: 'This account is waiting for a parent or guardian to approve it.',
  CONSENT_REJECTED: 'A guardian has not approved this account.',
  GUEST_READ_ONLY: 'Guests can view family content but cannot change it.',
};

const initSocket = (io) => {
  const log = (...args) => {
    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') console.log(...args);
  };

  // ─── JWT Authentication Middleware for Socket ────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication token missing'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password -refreshToken');

      if (!user || !user.isActive) {
        return next(new Error('User not found or deactivated'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  // ─── Connection Handler ────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    // A personal room lets the server re-sync this user's sockets when their
    // membership or consent changes (see socket/familyRooms.js).
    socket.join(userRoom(socket.user._id));
    socket.data.familyId = socket.user.familyId ? String(socket.user.familyId) : null;

    // Access is resolved once here and refreshed by syncUserFamilyRoom. Handlers
    // await it, so an event sent the instant the socket opens is still checked.
    // An unapproved minor never joins the family room, so they receive no
    // family messages in real time — the same rule the REST API enforces.
    const ready = resolveFamilyAccess(socket.user)
      .then((access) => {
        socket.data.access = access;
        if (access.canRead) socket.join(familyRoom(socket.data.familyId));
        socket.emit('family_access', publicAccess(access));
        log(`Socket connected: ${socket.user.fullName} (${socket.id}) access=${access.code || 'full'}`);
      })
      .catch((err) => {
        logger.error(`socket access error: ${err.message}`);
        socket.data.access = { canRead: false, canWrite: false, code: 'NO_FAMILY' };
      });

    const currentAccess = async () => {
      await ready;
      return socket.data.access;
    };

    // 1. Text messaging over WebSockets
    socket.on('send_message', async (data, callback) => {
      const reply = typeof callback === 'function' ? callback : () => {};
      try {
        await ready;
        // Re-read the user: a role change (e.g. to guest) or a guardian decision
        // made after this socket connected must apply to the very next message.
        const sender = await User.findById(socket.user._id).select('fullName role familyId memberType isActive');
        if (!sender || !sender.isActive) return reply({ error: 'User not found or deactivated' });

        const access = await resolveFamilyAccess(sender);
        if (!access.canWrite) {
          return reply({ error: ACCESS_MESSAGES[access.code], code: access.code });
        }

        const text = typeof data?.text === 'string' ? data.text.trim() : '';
        if (!text) return reply({ error: 'Message content cannot be empty' });

        const mentions = parseMentions(text, await getMentionableMembers(sender.familyId));

        const message = await Message.create({
          familyId: sender.familyId,
          sender: sender._id,
          text,
          mediaUrl: null,
          mediaType: null,
          mentions,
          readBy: [sender._id],
        });

        const populatedMessage = await message.populate('sender', 'fullName email avatar');
        io.to(familyRoom(sender.familyId)).emit('new_message', populatedMessage);

        const mentionSet = new Set(mentions.map(String));
        if (mentionSet.size > 0) {
          notifyUsers({
            userIds: [...mentionSet],
            familyId: sender.familyId,
            excludeUserId: sender._id,
            type: 'chat_mention',
            title: `${sender.fullName} mentioned you`,
            body: text,
            data: { messageId: String(message._id) },
          });
        }

        notifyFamilyMembers({
          familyId: sender.familyId,
          excludeUserId: sender._id,
          skipUserIds: [...mentionSet],
          type: 'chat_message',
          title: `${sender.fullName} sent a message`,
          body: text,
          data: { messageId: String(message._id) },
        });

        return reply({ success: true, message: populatedMessage });
      } catch (err) {
        logger.error(`send_message error: ${err.message}`);
        return reply({ error: 'Failed to send message' });
      }
    });

    // 2. Typing indicators — only members who may write can announce typing.
    socket.on('typing', async () => {
      const access = await currentAccess();
      if (!access?.canWrite || !socket.data.familyId) return;
      socket.to(familyRoom(socket.data.familyId)).emit('typing', {
        userId: socket.user._id,
        name: socket.user.fullName,
      });
    });

    socket.on('stop_typing', async () => {
      const access = await currentAccess();
      if (!access?.canWrite || !socket.data.familyId) return;
      socket.to(familyRoom(socket.data.familyId)).emit('stop_typing', {
        userId: socket.user._id,
      });
    });

    // 3. Read receipts — scoped to the reader's own family.
    socket.on('mark_read', async (payload) => {
      try {
        const access = await currentAccess();
        if (!access?.canRead || !socket.data.familyId) return;

        const messageId = payload?.messageId;
        const message = await Message.findOne({
          _id: messageId,
          familyId: socket.data.familyId,
        });
        if (!message) return;

        const alreadyRead = message.readBy.some((id) => id.toString() === String(socket.user._id));
        if (!alreadyRead) {
          message.readBy.push(socket.user._id);
          await message.save();

          socket.to(familyRoom(socket.data.familyId)).emit('message_read', {
            messageId,
            userId: socket.user._id,
            readerId: socket.user._id,
          });
        }
      } catch (error) {
        logger.error(`mark_read error: ${error.message}`);
      }
    });

    // ─── Disconnect Handler ────────────────────────────────────────────────
    socket.on('disconnect', () => {
      log(`Socket disconnected: ${socket.user.fullName}`);
    });
  });
};

module.exports = { initSocket };
