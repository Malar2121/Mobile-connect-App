const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const { notifyFamilyMembers } = require('../services/notificationService');
const logger = require('../utils/logger');

const initSocket = (io) => {
  const log = (...args) => {
    if (process.env.NODE_ENV !== 'production') console.log(...args);
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
  io.on('connection', async (socket) => {
    const familyId = String(socket.user.familyId);
    log(`Socket connected: ${socket.user.fullName} (${socket.id})`);

    // 1. Join family chat room
    if (familyId && familyId !== 'null') {
      socket.join(`family_${familyId}`);
      log(`${socket.user.fullName} joined room: family_${familyId}`);
    } else {
      log('User not in family, skipped joining room.');
    }

    // 2. Handle Text Messaging Directly over WebSockets
    socket.on('send_message', async (data, callback) => {
      try {
        const { text } = data;
        if (!text?.trim()) return callback?.({ error: 'Message content cannot be empty' });

        const message = await Message.create({
          familyId: socket.user.familyId,
          sender: socket.user._id,
          text: text.trim(),
          mediaUrl: null,
          mediaType: null,
          readBy: [socket.user._id], // Sender has read it
        });

        const populatedMessage = await message.populate('sender', 'fullName email avatar');

        // Emit 'new_message' to all users in the family room
        io.to(`family_${familyId}`).emit('new_message', populatedMessage);

        // Async notify offline users
        notifyFamilyMembers({
          familyId: socket.user.familyId,
          excludeUserId: socket.user._id,
          type: 'chat_message',
          title: `${socket.user.fullName} sent a message`,
          body: text.trim(),
          data: { messageId: String(message._id) },
        });

        // Optional callback to sender to confirm message was saved and sent
        if (callback) callback({ success: true, message: populatedMessage });
      } catch (err) {
        logger.error(`send_message error: ${err.message}`);
        if (callback) callback({ error: 'Failed to send message' });
      }
    });

    // 3. Typing Indicator
    socket.on('typing', () => {
      socket.to(`family_${familyId}`).emit('typing', {
        userId: socket.user._id,
        name: socket.user.fullName,
      });
    });

    // 4. Stop Typing Indicator
    socket.on('stop_typing', () => {
      socket.to(`family_${familyId}`).emit('stop_typing', {
        userId: socket.user._id,
      });
    });

    // 5. Read Receipt updates 
    socket.on('mark_read', async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const alreadyRead = message.readBy.some((id) => id.toString() === String(socket.user._id));

        if (!alreadyRead) {
          message.readBy.push(socket.user._id);
          await message.save();

          // Inform others that the message has been read by someone new
          socket.to(`family_${familyId}`).emit('message_read', {
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
