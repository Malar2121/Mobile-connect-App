const Memory = require('../models/Memory');
const Comment = require('../models/Comment');
const { notifyFamilyMembers } = require('../services/notificationService');

// ══════════════════════════════════════════════════════════
// POST /api/memories/upload
// Upload image or video to Cloudinary
// ══════════════════════════════════════════════════════════
const uploadMemory = async (req, res) => {
  try {
    const { caption, tags, album, location, coordinates } = req.body;
    const { familyId, _id: userId, fullName } = req.user;

    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family to upload memories' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No media file provided' });
    }

    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch (err) {
        if (Array.isArray(tags)) parsedTags = tags;
        else parsedTags = [tags];
      }
    }
    
    let parsedCoordinates;
    if (coordinates) {
      try {
        parsedCoordinates = typeof coordinates === 'string' ? JSON.parse(coordinates) : coordinates;
      } catch (e) {
        // ignore
      }
    }

    const isVideo = req.file.mimetype.startsWith('video/');

    const memory = await Memory.create({
      familyId,
      uploadedBy: userId,
      mediaUrl: req.file.path,
      mediaType: isVideo ? 'video' : 'image',
      caption,
      tags: parsedTags,
      album,
      likes: [],
      location: location?.trim(),
      coordinates: parsedCoordinates,
    });

    const populatedMemory = await memory.populate('uploadedBy', 'fullName email avatar');

    // Fire off async notifications to the rest of the family
    notifyFamilyMembers({
      familyId,
      excludeUserId: userId,
      type: 'memory_uploaded',
      title: 'New Memory! 📸',
      body: `${fullName} just uploaded a new ${isVideo ? 'video' : 'photo'}.`,
    });

    return res.status(201).json({
      success: true,
      message: 'Memory uploaded successfully',
      data: populatedMemory,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// GET /api/memories
// Fetch memories for a family
// ══════════════════════════════════════════════════════════
const getFamilyMemories = async (req, res) => {
  try {
    const { familyId } = req.user;

    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family to view memories' });
    }

    const memories = await Memory.find({ familyId })
      .populate('uploadedBy', 'fullName email avatar')
      .populate('tags', 'fullName email avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Family memories retrieved successfully',
      data: memories,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// GET /api/memories/:id
// Return memory + tags + uploader info
// ══════════════════════════════════════════════════════════
const getMemoryDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { familyId } = req.user;

    const memory = await Memory.findOne({ _id: id, familyId })
      .populate('uploadedBy', 'fullName email avatar')
      .populate('tags', 'fullName email avatar')
      .populate('likes', 'fullName avatar');

    if (!memory) {
      return res.status(404).json({ success: false, message: 'Memory not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Memory details retrieved successfully',
      data: memory,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// POST /api/memories/like
// Toggle like
// ══════════════════════════════════════════════════════════
const likeMemory = async (req, res) => {
  try {
    const { memoryId } = req.body;
    const { familyId, _id: userId } = req.user;

    const memory = await Memory.findOne({ _id: memoryId, familyId });

    if (!memory) {
      return res.status(404).json({ success: false, message: 'Memory not found' });
    }

    const likeIndex = memory.likes.findIndex((id) => id.toString() === userId.toString());

    if (likeIndex > -1) {
      // User has already liked it, so un-like
      memory.likes.splice(likeIndex, 1);
    } else {
      // User hasn't liked it, so like
      memory.likes.push(userId);
    }

    await memory.save();

    return res.status(200).json({
      success: true,
      message: likeIndex > -1 ? 'Memory unliked' : 'Memory liked',
      data: memory,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// DELETE /api/memories/:id
// Delete memory (only uploader or admin)
// ══════════════════════════════════════════════════════════
const deleteMemory = async (req, res) => {
  try {
    const { id } = req.params;
    const { familyId, _id: userId, role } = req.user;

    const memory = await Memory.findOne({ _id: id, familyId });

    if (!memory) {
      return res.status(404).json({ success: false, message: 'Memory not found' });
    }

    if (memory.uploadedBy.toString() !== userId.toString() && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this memory' });
    }

    await Memory.deleteOne({ _id: id });
    await Comment.deleteMany({ onModel: 'Memory', onDocument: id });

    return res.status(200).json({
      success: true,
      message: 'Memory deleted successfully',
      data: {},
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// GET /api/memories/:id/comments
// Get comments for a memory
// ══════════════════════════════════════════════════════════
const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { familyId } = req.user;
    
    const memory = await Memory.findOne({ _id: id, familyId });
    if (!memory) return res.status(404).json({ success: false, message: 'Memory not found' });

    const comments = await Comment.find({ onModel: 'Memory', onDocument: id, family: familyId })
      .populate('author', 'fullName avatar')
      .sort({ createdAt: 1 });

    return res.status(200).json({ success: true, data: { comments } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// POST /api/memories/:id/comments
// Add a comment to a memory
// ══════════════════════════════════════════════════════════
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const { familyId, _id: userId } = req.user;

    if (!content) return res.status(400).json({ success: false, message: 'Content is required' });

    const memory = await Memory.findOne({ _id: id, familyId });
    if (!memory) return res.status(404).json({ success: false, message: 'Memory not found' });

    const comment = await Comment.create({
      author: userId,
      family: familyId,
      onModel: 'Memory',
      onDocument: id,
      content,
    });

    await comment.populate('author', 'fullName avatar');

    // Notify participants
    notifyFamilyMembers({
      familyId,
      excludeUserId: userId,
      type: 'memory_comment',
      title: 'New Memory Comment',
      body: `${req.user.fullName} commented: ${content}`,
      data: { memoryId: String(memory._id) },
    });

    return res.status(201).json({ success: true, data: { comment } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  uploadMemory,
  getFamilyMemories,
  getMemoryDetails,
  likeMemory,
  deleteMemory,
  getComments,
  addComment,
};
