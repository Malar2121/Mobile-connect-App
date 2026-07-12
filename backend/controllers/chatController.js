const Message = require('../models/Message');
const { notifyFamilyMembers } = require('../services/notificationService');

const MESSAGE_POPULATE = [
  { path: 'sender', select: 'fullName avatar' },
  { path: 'readBy', select: 'fullName' },
  { path: 'replyTo', select: 'text mediaUrl mediaType sender', populate: { path: 'sender', select: 'fullName avatar' } },
  { path: 'pinnedBy', select: 'fullName' },
  { path: 'starredBy', select: 'fullName' },
  { path: 'mentions', select: 'fullName' },
];

function emitToFamily(req, familyId, event, payload) {
  const io = req.app?.get?.('io');
  if (io) io.to(`family_${familyId}`).emit(event, payload);
}

function resolveMediaType(file, bodyMediaType) {
  if (!file) return { mediaUrl: null, mediaType: null, documentName: null };
  const mime = file.mimetype || '';
  let mediaType = 'image';
  if (mime.startsWith('video/')) mediaType = 'video';
  else if (mime.startsWith('audio/')) mediaType = 'audio';
  else if (mime.includes('pdf') || mime.includes('document') || mime.includes('msword')) mediaType = 'document';
  else if (bodyMediaType && ['image', 'video', 'audio', 'document'].includes(bodyMediaType)) {
    mediaType = bodyMediaType;
  }
  return {
    mediaUrl: file.path,
    mediaType,
    documentName: mediaType === 'document' ? file.originalname : null,
  };
}

// Escape user-supplied text so it is treated as a literal in a MongoDB $regex
// (prevents regex-injection / ReDoS and invalid-regex 500 errors).
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseMentions(text, members) {
  if (!text || !members?.length) return [];
  const ids = [];
  members.forEach((m) => {
    const name = m.fullName || m.name;
    if (name && text.includes(`@${name}`)) ids.push(m._id ?? m.id);
  });
  return ids;
}

async function populateMessage(message) {
  return message.populate(MESSAGE_POPULATE);
}

// POST /api/chat/send
const sendMessage = async (req, res) => {
  try {
    const { text, replyTo, mediaDuration, documentName, mediaType: bodyMediaType, waveform: bodyWaveform } = req.body;
    const { familyId, _id: senderId, fullName } = req.user;

    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family to send a message' });
    }

    if (!text && !req.file) {
      return res.status(400).json({ success: false, message: 'Message text or media is required' });
    }

    const media = resolveMediaType(req.file, bodyMediaType);

    if (replyTo) {
      const parent = await Message.findOne({ _id: replyTo, familyId });
      if (!parent) {
        return res.status(400).json({ success: false, message: 'Reply target not found in this family' });
      }
    }

    let parsedWaveform = [];
    if (bodyWaveform) {
      try {
        parsedWaveform = typeof bodyWaveform === 'string' ? JSON.parse(bodyWaveform) : bodyWaveform;
      } catch (err) {
        // ignore parse error
      }
    }

    const newMessage = await Message.create({
      familyId,
      sender: senderId,
      text: text ? text.trim() : '',
      ...media,
      mediaDuration: mediaDuration ? Number(mediaDuration) : null,
      waveform: Array.isArray(parsedWaveform) ? parsedWaveform : [],
      documentName: documentName || media.documentName,
      replyTo: replyTo || null,
      readBy: [senderId],
    });

    const populatedMessage = await populateMessage(newMessage);
    emitToFamily(req, familyId, 'new_message', populatedMessage);

    const bodyLabel =
      text ||
      (media.mediaType === 'video'
        ? 'Sent a video'
        : media.mediaType === 'audio'
          ? 'Sent a voice message'
          : media.mediaType === 'document'
            ? 'Sent a document'
            : 'Sent a photo');

    notifyFamilyMembers({
      familyId,
      excludeUserId: senderId,
      type: 'chat_message',
      title: `${fullName} sent a message`,
      body: bodyLabel,
      data: { messageId: String(newMessage._id) },
    });

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedMessage,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/chat/messages?limit=50&before=ISO_DATE
const getFamilyMessages = async (req, res) => {
  try {
    const { familyId } = req.user;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    const before = req.query.before;

    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family to view messages' });
    }

    const filter = { familyId };
    if (before) {
      filter.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate(MESSAGE_POPULATE);

    const ordered = messages.reverse();
    const hasMore = messages.length === limit;

    return res.status(200).json({
      success: true,
      message: 'Messages retrieved successfully',
      data: ordered,
      meta: { hasMore, limit },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/chat/:id
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { familyId, _id: userId, role } = req.user;

    const message = await Message.findOne({ _id: id, familyId });
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender.toString() !== userId.toString() && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only delete your own messages' });
    }

    await Message.deleteOne({ _id: id });
    emitToFamily(req, familyId, 'message_deleted', { messageId: id, familyId: String(familyId) });

    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
      data: { messageId: id },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/chat/:id
const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const { familyId, _id: userId } = req.user;

    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const message = await Message.findOne({ _id: id, familyId });
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own messages' });
    }

    message.text = text.trim();
    message.editedAt = new Date();
    await message.save();
    const populated = await populateMessage(message);
    emitToFamily(req, familyId, 'message_updated', populated);

    return res.status(200).json({ success: true, data: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/chat/:id/react
const reactToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const { familyId, _id: userId } = req.user;

    if (!emoji) return res.status(400).json({ success: false, message: 'Emoji is required' });

    const message = await Message.findOne({ _id: id, familyId });
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    message.reactions = (message.reactions || []).filter((r) => String(r.userId) !== String(userId));
    message.reactions.push({ userId, emoji });
    await message.save();

    const populated = await populateMessage(message);
    emitToFamily(req, familyId, 'message_updated', populated);

    return res.status(200).json({ success: true, data: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/chat/:id/pin
const pinMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { familyId, _id: userId } = req.user;

    await Message.updateMany({ familyId, pinnedAt: { $ne: null } }, { $set: { pinnedAt: null, pinnedBy: null } });

    const message = await Message.findOneAndUpdate(
      { _id: id, familyId },
      { pinnedAt: new Date(), pinnedBy: userId },
      { new: true },
    );
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    const populated = await populateMessage(message);
    emitToFamily(req, familyId, 'message_updated', populated);

    return res.status(200).json({ success: true, data: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/chat/:id/pin
const unpinMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { familyId } = req.user;

    const message = await Message.findOneAndUpdate(
      { _id: id, familyId },
      { pinnedAt: null, pinnedBy: null },
      { new: true },
    );
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    const populated = await populateMessage(message);
    emitToFamily(req, familyId, 'message_updated', populated);

    return res.status(200).json({ success: true, data: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/chat/:id/star
const toggleStarMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { familyId, _id: userId } = req.user;

    const message = await Message.findOne({ _id: id, familyId });
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    const starred = (message.starredBy || []).map(String);
    const uid = String(userId);
    const isNowStarred = !starred.includes(uid);
    if (isNowStarred) {
      message.starredBy.push(userId);
    } else {
      message.starredBy = message.starredBy.filter((x) => String(x) !== uid);
    }
    await message.save();

    // Compute the starred flag BEFORE populate — after populate starredBy holds
    // User documents, so String(doc) no longer equals the raw user id.
    const populated = await populateMessage(message);
    emitToFamily(req, familyId, 'message_updated', populated);

    return res.status(200).json({ success: true, data: populated, starred: isNowStarred });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/chat/search?q=&type=text|media|document|link|member|date
const searchMessages = async (req, res) => {
  try {
    const { familyId } = req.user;
    const { q = '', type = 'text', memberId, date } = req.query;

    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family to search messages' });
    }

    const filter = { familyId };

    if (type === 'media') {
      filter.mediaType = { $in: ['image', 'video'] };
    } else if (type === 'document') {
      filter.mediaType = 'document';
    } else if (type === 'audio') {
      filter.mediaType = 'audio';
    } else if (type === 'link') {
      filter.text = { $regex: /https?:\/\//i };
    } else if (memberId) {
      filter.sender = memberId;
    } else if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    } else if (q.trim()) {
      filter.text = { $regex: escapeRegex(q.trim()), $options: 'i' };
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(80)
      .populate(MESSAGE_POPULATE);

    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/chat/pinned
const getPinnedMessages = async (req, res) => {
  try {
    const { familyId } = req.user;
    const messages = await Message.find({ familyId, pinnedAt: { $ne: null } })
      .sort({ pinnedAt: -1 })
      .populate(MESSAGE_POPULATE);
    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/chat/starred
const getStarredMessages = async (req, res) => {
  try {
    const { familyId, _id: userId } = req.user;
    const messages = await Message.find({ familyId, starredBy: userId })
      .sort({ updatedAt: -1 })
      .populate(MESSAGE_POPULATE);
    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  sendMessage,
  getFamilyMessages,
  deleteMessage,
  editMessage,
  reactToMessage,
  pinMessage,
  unpinMessage,
  toggleStarMessage,
  searchMessages,
  getPinnedMessages,
  getStarredMessages,
};
