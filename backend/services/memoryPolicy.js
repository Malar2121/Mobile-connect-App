const mongoose = require('mongoose');
const Memory = require('../models/Memory');
const User = require('../models/User');

/**
 * Who sees and reviews shared photos and videos (proposal §8: "Members
 * approve shared photos and videos").
 *
 * - A new upload is 'pending' until another adult or elder member of the same
 *   family approves it. Guests and child accounts never review.
 * - Pending and rejected memories stay out of every shared view; the uploader
 *   always sees their own, and reviewers can open pending ones to decide.
 * - If nobody else in the family could review, the upload is approved
 *   automatically — there is no one else to see it yet.
 */

const HIDDEN_STATUSES = ['pending', 'rejected'];
const DEFAULT_QUOTA_MB = 2048;

const idOf = (value) => String(value?._id ?? value);

function isApproved(memory) {
  return !HIDDEN_STATUSES.includes(memory?.status);
}

function isUploader(user, memory) {
  return idOf(memory.uploadedBy) === idOf(user._id);
}

function canReviewMemories(user) {
  return Boolean(user?.familyId) && user.role !== 'guest' && user.memberType !== 'child';
}

/** Query for memories shown in shared lists: approved ones plus the user's own uploads. */
function visibleMemoryFilter(user) {
  return {
    familyId: user.familyId,
    $or: [{ status: { $nin: HIDDEN_STATUSES } }, { uploadedBy: user._id }],
  };
}

/** Filter that keeps only memories the whole family may see. */
const approvedOnly = () => ({ status: { $nin: HIDDEN_STATUSES } });

/** Whether a user may open one memory. The caller has already matched familyId. */
function canViewMemory(user, memory) {
  if (isApproved(memory) || isUploader(user, memory)) return true;
  return memory.status === 'pending' && canReviewMemories(user);
}

/** Family members who could review an upload from `uploaderId`. */
async function findReviewers(familyId, uploaderId) {
  return User.find({
    familyId,
    _id: { $ne: uploaderId },
    role: { $ne: 'guest' },
    memberType: { $ne: 'child' },
    isActive: { $ne: false },
  }).select('_id');
}

function familyQuotaBytes() {
  const mb = Number.parseFloat(process.env.FAMILY_MEDIA_QUOTA_MB);
  const limit = Number.isFinite(mb) && mb > 0 ? mb : DEFAULT_QUOTA_MB;
  return Math.round(limit * 1024 * 1024);
}

async function familyUsageBytes(familyId) {
  const [row] = await Memory.aggregate([
    { $match: { familyId: new mongoose.Types.ObjectId(String(familyId)) } },
    { $group: { _id: null, total: { $sum: '$bytes' } } },
  ]);
  return row?.total ?? 0;
}

module.exports = {
  HIDDEN_STATUSES,
  isApproved,
  isUploader,
  canReviewMemories,
  visibleMemoryFilter,
  approvedOnly,
  canViewMemory,
  findReviewers,
  familyQuotaBytes,
  familyUsageBytes,
};
