const FamilyMember = require('../models/FamilyMember');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// ──────────────────────────────────────────
//  GET /api/family-tree
//  Return all relationships in the family tree
// ──────────────────────────────────────────
const getFamilyTree = asyncHandler(async (req, res) => {
  const members = await FamilyMember.find({
    family: req.user.familyId,
    isActive: true,
  })
    .populate('user', 'fullName avatar')
    .populate('relatedTo', 'fullName avatar');

  // Build a node list for tree visualization
  const nodes = members.map((m) => ({
    id: String(m.user._id),
    name: m.user.fullName || 'Family member',
    avatar: m.user.avatar || null,
    dateOfBirth: m.user.dateOfBirth ?? null,
    role: m.role,
    nickname: m.nickname,
    relationshipType: m.relationshipType,
    relatedTo: m.relatedTo ? String(m.relatedTo._id) : null,
    relatedToName: m.relatedTo?.fullName ?? null,
    lifeEvents: m.lifeEvents || [],
  }));

  return successResponse(res, { nodes }, 'Family tree retrieved');
});

// ──────────────────────────────────────────
//  PUT /api/family-tree/relationship
//  Update a member's relationship in the tree
// ──────────────────────────────────────────
const updateRelationship = asyncHandler(async (req, res) => {
  const { userId, relationshipType, relatedToUserId, nickname } = req.body;

  if (req.user.role !== 'admin' && String(req.user._id) !== userId) {
    return errorResponse(res, 'Not authorized to update other members\' relationships', 403);
  }

  const member = await FamilyMember.findOne({
    family: req.user.familyId,
    user: userId,
    isActive: true,
  });

  if (!member) return errorResponse(res, 'Family member not found', 404);

  if (relationshipType) member.relationshipType = relationshipType;
  if (nickname !== undefined) member.nickname = nickname;

  if (relatedToUserId) {
    // Validate that the target user is in the same family
    const relatedMember = await FamilyMember.findOne({
      family: req.user.familyId,
      user: relatedToUserId,
      isActive: true,
    });
    if (!relatedMember) {
      return errorResponse(res, 'Target user is not a member of this family', 404);
    }
    member.relatedTo = relatedToUserId;
  }

  await member.save();
  await member.populate('user', 'fullName avatar');
  await member.populate('relatedTo', 'fullName');

  return successResponse(res, { member }, 'Relationship updated');
});

module.exports = { getFamilyTree, updateRelationship };
