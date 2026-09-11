const Memory = require('../models/Memory');
const Comment = require('../models/Comment');
const { notifyFamilyMembers, notifyUsers } = require('../services/notificationService');
const {
  isApproved,
  isUploader,
  canReviewMemories,
  visibleMemoryFilter,
  canViewMemory,
  findReviewers,
  familyQuotaBytes,
  familyUsageBytes,
} = require('../services/memoryPolicy');

const notFound = (res) => res.status(404).json({ success: false, message: 'Memory not found' });

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
    const kind = isVideo ? 'video' : 'photo';

    // Proposal §8: another member approves before the family sees it.
    const reviewers = await findReviewers(familyId, userId);
    const needsReview = reviewers.length > 0;

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
      bytes: Number(req.file.size ?? req.file.bytes) || 0,
      status: needsReview ? 'pending' : 'approved',
      review: needsReview ? {} : { automatic: true, reviewedAt: new Date() },
    });

    const populatedMemory = await memory.populate('uploadedBy', 'fullName email avatar');

    if (needsReview) {
      notifyUsers({
        userIds: reviewers.map((r) => r._id),
        familyId,
        excludeUserId: userId,
        type: 'memory_review_requested',
        params: { name: fullName, kind },
        title: 'A memory is waiting for approval',
        body: `${fullName} shared a new ${kind}. Approve it before the family can see it.`,
        data: { memoryId: String(memory._id) },
      });
    } else {
      notifyFamilyMembers({
        familyId,
        excludeUserId: userId,
        type: 'memory_uploaded',
        params: { name: fullName, kind },
        title: 'New Memory! 📸',
        body: `${fullName} just uploaded a new ${kind}.`,
        data: { memoryId: String(memory._id) },
      });
    }

    return res.status(201).json({
      success: true,
      message: needsReview ? 'Memory sent for approval' : 'Memory uploaded successfully',
      data: populatedMemory,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// GET /api/memories
// Approved family memories plus the caller's own uploads
// ══════════════════════════════════════════════════════════
const getFamilyMemories = async (req, res) => {
  try {
    const { familyId } = req.user;

    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family to view memories' });
    }

    const memories = await Memory.find(visibleMemoryFilter(req.user))
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
// GET /api/memories/pending
// Review queue: other members' uploads awaiting approval
// ══════════════════════════════════════════════════════════
const getPendingMemories = async (req, res) => {
  try {
    const { familyId, _id: userId } = req.user;

    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family to review memories' });
    }
    if (!canReviewMemories(req.user)) {
      return res.status(403).json({
        success: false,
        code: 'MEMORY_REVIEW_FORBIDDEN',
        message: 'Only adult family members can review shared memories.',
      });
    }

    const memories = await Memory.find({ familyId, status: 'pending', uploadedBy: { $ne: userId } })
      .populate('uploadedBy', 'fullName email avatar')
      .populate('tags', 'fullName email avatar')
      .sort({ createdAt: 1 });

    return res.status(200).json({ success: true, data: memories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// GET /api/memories/usage
// Family storage used against the quota
// ══════════════════════════════════════════════════════════
const getMediaUsage = async (req, res) => {
  try {
    const { familyId } = req.user;
    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family' });
    }
    const [usedBytes, quotaBytes] = [await familyUsageBytes(familyId), familyQuotaBytes()];
    return res.status(200).json({ success: true, data: { usedBytes, quotaBytes } });
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
      .populate('likes', 'fullName avatar')
      .populate('review.reviewedBy', 'fullName');

    // A hidden memory answers exactly like a missing one, so its existence
    // is not revealed to members who may not see it.
    if (!memory || !canViewMemory(req.user, memory)) return notFound(res);

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
// POST /api/memories/:id/approve   ·   POST /api/memories/:id/reject
// ══════════════════════════════════════════════════════════
async function reviewMemory(req, res, decision) {
  try {
    const { familyId, _id: userId, fullName } = req.user;
    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family to review memories' });
    }

    const memory = await Memory.findOne({ _id: req.params.id, familyId });
    if (!memory) return notFound(res);

    if (isUploader(req.user, memory)) {
      return res.status(403).json({
        success: false,
        code: 'SELF_REVIEW',
        message: 'Another family member must review your upload.',
      });
    }
    if (!canReviewMemories(req.user)) {
      return res.status(403).json({
        success: false,
        code: 'MEMORY_REVIEW_FORBIDDEN',
        message: 'Only adult family members can review shared memories.',
      });
    }
    if (memory.status !== 'pending') {
      return res.status(409).json({ success: false, code: 'ALREADY_REVIEWED', message: 'This memory has already been reviewed.' });
    }

    const reason = decision === 'rejected' ? String(req.body?.reason ?? '').trim().slice(0, 300) : '';

    // Conditional update: if two members decide at the same moment, only the
    // first decision is applied.
    const updated = await Memory.findOneAndUpdate(
      { _id: memory._id, familyId, status: 'pending' },
      { status: decision, review: { reviewedBy: userId, reviewedAt: new Date(), reason, automatic: false } },
      { new: true },
    ).populate('uploadedBy', 'fullName email avatar');

    if (!updated) {
      return res.status(409).json({ success: false, code: 'ALREADY_REVIEWED', message: 'This memory has already been reviewed.' });
    }

    const kind = updated.mediaType === 'video' ? 'video' : 'photo';
    const uploaderId = updated.uploadedBy._id;

    notifyUsers({
      userIds: [uploaderId],
      familyId,
      type: decision === 'approved' ? 'memory_approved' : 'memory_rejected',
      params: { name: fullName, kind, reason },
      title: decision === 'approved' ? 'Your memory was approved' : 'Your memory was not approved',
      body:
        decision === 'approved'
          ? `${fullName} approved your ${kind}. The family can see it now.`
          : `${fullName} did not approve your ${kind}.${reason ? ` Reason: ${reason}` : ''}`,
      data: { memoryId: String(updated._id) },
    });

    if (decision === 'approved') {
      notifyFamilyMembers({
        familyId,
        excludeUserId: uploaderId,
        skipUserIds: [userId],
        type: 'memory_uploaded',
        params: { name: updated.uploadedBy.fullName, kind },
        title: 'New Memory! 📸',
        body: `${updated.uploadedBy.fullName} shared a new ${kind}.`,
        data: { memoryId: String(updated._id) },
      });
    }

    return res.status(200).json({
      success: true,
      message: decision === 'approved' ? 'Memory approved' : 'Memory rejected',
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

const approveMemory = (req, res) => reviewMemory(req, res, 'approved');
const rejectMemory = (req, res) => reviewMemory(req, res, 'rejected');

// ══════════════════════════════════════════════════════════
// POST /api/memories/like
// Toggle like
// ══════════════════════════════════════════════════════════
const likeMemory = async (req, res) => {
  try {
    const { memoryId } = req.body;
    const { familyId, _id: userId } = req.user;

    const memory = await Memory.findOne({ _id: memoryId, familyId });

    if (!memory || !isApproved(memory)) return notFound(res);

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

    if (!memory) return notFound(res);

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
    if (!memory || !isApproved(memory)) return notFound(res);

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
    if (!memory || !isApproved(memory)) return notFound(res);

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
      params: { name: req.user.fullName, content },
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
  getPendingMemories,
  getMediaUsage,
  getMemoryDetails,
  approveMemory,
  rejectMemory,
  likeMemory,
  deleteMemory,
  getComments,
  addComment,
};
