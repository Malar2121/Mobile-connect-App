const Family = require('../models/Family');
const User = require('../models/User');
const FamilyMember = require('../models/FamilyMember');
const JoinRequest = require('../models/JoinRequest');
const crypto = require('crypto');

// ──────────────────────────────────────────────────────────
// Helper: generate a unique 8-char uppercase invite code
// Format: ABCD-EFGH
// ──────────────────────────────────────────────────────────
const makeInviteCode = () => {
  const raw = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 chars
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
};

// ══════════════════════════════════════════════════════════
// POST /api/family/create
// Create a new family. The logged-in user becomes the admin
// and is automatically added as the first member.
// ══════════════════════════════════════════════════════════
const createFamily = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Family name is required' });
    }

    // A user can only belong to one family at a time
    if (req.user.familyId) {
      return res.status(400).json({
        success: false,
        message: 'You already belong to a family. Leave it before creating a new one.',
      });
    }

    // Ensure invite code uniqueness — retry once on collision (extremely rare)
    let inviteCode = makeInviteCode();
    const collision = await Family.findOne({ inviteCode });
    if (collision) inviteCode = makeInviteCode();

    // Create family with creator as first member
    const family = await Family.create({
      name: name.trim(),
      createdBy: req.user._id,
      members: [req.user._id],
      inviteCode,
    });

    // Link family to user and promote to admin role
    await User.findByIdAndUpdate(req.user._id, {
      familyId: family._id,
      role: 'admin',
    });

    // Create the creator's FamilyMember record so the family tree is populated
    // for real (non-seeded) families as well.
    await FamilyMember.findOneAndUpdate(
      { family: family._id, user: req.user._id },
      { family: family._id, user: req.user._id, role: 'admin', joinedVia: 'creator', isActive: true },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Populate members for the response
    await family.populate('members', 'fullName email avatar role memberType dateOfBirth');
    await family.populate('createdBy', 'fullName email');

    return res.status(201).json({
      success: true,
      message: 'Family created successfully',
      data: { family },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// GET /api/family/my-family
// Return the logged-in user's family with all member details
// ══════════════════════════════════════════════════════════
const getMyFamily = async (req, res) => {
  try {
    if (!req.user.familyId) {
      return res.status(404).json({
        success: false,
        message: 'You are not part of any family yet',
      });
    }

    const family = await Family.findById(req.user.familyId)
      .populate('members', 'fullName email avatar role memberType dateOfBirth lastSeen createdAt')
      .populate('createdBy', 'fullName email avatar');

    if (!family) {
      return res.status(404).json({ success: false, message: 'Family not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Family retrieved successfully',
      data: {
        family,
        memberCount: family.members.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// POST /api/family/join
// User joins an existing family using an invite code
// ══════════════════════════════════════════════════════════
const joinFamilyByCode = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ success: false, message: 'Invite code is required' });
    }

    if (req.user.familyId) {
      return res.status(400).json({
        success: false,
        message: 'You already belong to a family. Leave it before joining another.',
      });
    }

    const family = await Family.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (!family) {
      return res.status(404).json({ success: false, message: 'Invalid invite code' });
    }

    const alreadyMember = family.members.some(
      (memberId) => String(memberId) === String(req.user._id)
    );
    if (alreadyMember) {
      return res.status(409).json({ success: false, message: 'You are already a member' });
    }

    if (family.privacySettings?.requireApproval) {
      // Create join request
      const request = await JoinRequest.findOneAndUpdate(
        { family: family._id, user: req.user._id },
        { family: family._id, user: req.user._id, status: 'pending' },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(202).json({
        success: true,
        message: `Your request to join "${family.name}" has been sent to the admins.`,
        data: { request }
      });
    }

    // Instant join
    family.members.push(req.user._id);
    await family.save();

    await User.findByIdAndUpdate(req.user._id, { familyId: family._id });

    await FamilyMember.findOneAndUpdate(
      { family: family._id, user: req.user._id },
      { family: family._id, user: req.user._id, role: 'member', joinedVia: 'invite_code', isActive: true },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await family.populate('members', 'fullName email avatar role memberType dateOfBirth');
    await family.populate('createdBy', 'fullName email');

    return res.status(200).json({
      success: true,
      message: `You have joined the "${family.name}" family!`,
      data: { family },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// POST /api/family/invite
// Generate (or return existing) invite code + shareable link
// Only family members can call this
// ══════════════════════════════════════════════════════════
const inviteMember = async (req, res) => {
  try {
    if (!req.user.familyId) {
      return res.status(403).json({
        success: false,
        message: 'You must be part of a family to invite someone',
      });
    }

    const family = await Family.findById(req.user.familyId);
    if (!family) {
      return res.status(404).json({ success: false, message: 'Family not found' });
    }

    // Optionally regenerate the invite code (admin only)
    if (req.body.regenerate === true && req.user.role === 'admin') {
      family.inviteCode = makeInviteCode();
      await family.save();
    }

    const clientUrl = process.env.CLIENT_URL;
    if (!clientUrl) {
      return res.status(500).json({
        success: false,
        message: 'CLIENT_URL is not configured',
      });
    }
    const inviteLink = `${clientUrl}/join?code=${family.inviteCode}`;

    return res.status(200).json({
      success: true,
      message: 'Invite code ready to share',
      data: {
        familyName: family.name,
        inviteCode: family.inviteCode,
        inviteLink,
        expiresAt: null, // codes don't expire unless regenerated
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// DELETE /api/family/leave
// User leaves their current family (cannot leave if admin)
// ══════════════════════════════════════════════════════════
const leaveFamily = async (req, res) => {
  try {
    if (!req.user.familyId) {
      return res.status(400).json({ success: false, message: 'You are not in any family' });
    }

    if (req.user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Admins cannot leave. Transfer admin role to another member first.',
      });
    }

    const family = await Family.findById(req.user.familyId);
    if (!family) {
      return res.status(404).json({ success: false, message: 'Family not found' });
    }

    // Remove user from members array
    family.members = family.members.filter(
      (memberId) => String(memberId) !== String(req.user._id)
    );
    await family.save();

    // Clear user's familyId and reset role
    await User.findByIdAndUpdate(req.user._id, { familyId: null, role: 'member' });

    // Remove their FamilyMember record so they no longer appear in the tree
    await FamilyMember.deleteOne({ family: family._id, user: req.user._id });

    return res.status(200).json({
      success: true,
      message: `You have left the "${family.name}" family`,
      data: {},
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateFamily = async (req, res) => {
  try {
    if (!req.user.familyId) return res.status(403).json({ success: false, message: 'Not in a family' });
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });

    const { name, photoUrl, privacySettings } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (privacySettings) updateData.privacySettings = privacySettings;

    const family = await Family.findByIdAndUpdate(req.user.familyId, updateData, { new: true });
    res.status(200).json({ success: true, data: { family } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateMemberRole = async (req, res) => {
  try {
    if (!req.user.familyId) return res.status(403).json({ success: false, message: 'Not in a family' });
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });

    const targetUserId = req.params.id;
    const { role } = req.body;
    if (!['admin', 'parent', 'member', 'child'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Update User model
    await User.findByIdAndUpdate(targetUserId, { role });
    // Update FamilyMember model
    const familyMember = await FamilyMember.findOneAndUpdate(
      { family: req.user.familyId, user: targetUserId },
      { role },
      { new: true }
    );
    res.status(200).json({ success: true, data: { familyMember } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// PUT /api/family/members/:id/type
// Admin sets a member's type (adult/child/elder) and optional
// date of birth. Drives the client UI mode and the safety
// tracking policy for children and elders.
// ══════════════════════════════════════════════════════════
const updateMemberType = async (req, res) => {
  try {
    if (!req.user.familyId) return res.status(403).json({ success: false, message: 'Not in a family' });
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });

    const targetUserId = req.params.id;
    const { memberType, dateOfBirth } = req.body;

    if (!['adult', 'child', 'elder'].includes(memberType)) {
      return res.status(400).json({ success: false, message: 'memberType must be adult, child or elder' });
    }

    const target = await User.findOne({ _id: targetUserId, familyId: req.user.familyId });
    if (!target) {
      return res.status(404).json({ success: false, message: 'Member not found in your family' });
    }

    target.memberType = memberType;
    target.elderMode = memberType === 'elder';
    if (dateOfBirth !== undefined) {
      const parsed = dateOfBirth ? new Date(dateOfBirth) : null;
      if (parsed && Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid dateOfBirth' });
      }
      target.dateOfBirth = parsed;
    }
    await target.save({ validateBeforeSave: false });

    const io = req.app.get('io');
    if (io) {
      io.to(`family_${req.user.familyId}`).emit('member_type_changed', {
        userId: target._id,
        memberType,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Member type updated',
      data: {
        user: {
          _id: target._id,
          fullName: target.fullName,
          memberType: target.memberType,
          dateOfBirth: target.dateOfBirth,
        },
      },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid member id' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addLifeEvent = async (req, res) => {
  try {
    if (!req.user.familyId) return res.status(403).json({ success: false, message: 'Not in a family' });
    const targetUserId = req.params.id;
    
    // Only self or admin can add life events
    if (String(req.user._id) !== targetUserId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { title, date, description, type } = req.body;
    const familyMember = await FamilyMember.findOne({ family: req.user.familyId, user: targetUserId });
    if (!familyMember) return res.status(404).json({ success: false, message: 'Member not found' });

    familyMember.lifeEvents.push({ title, date, description, type });
    await familyMember.save();

    res.status(200).json({ success: true, data: { familyMember } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createJoinRequest = async (req, res) => {
  try {
    const { familyId } = req.body;
    if (req.user.familyId) return res.status(400).json({ success: false, message: 'Already in a family' });
    
    const request = await JoinRequest.findOneAndUpdate(
      { family: familyId, user: req.user._id },
      { family: familyId, user: req.user._id, status: 'pending' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ success: true, data: { request } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getJoinRequests = async (req, res) => {
  try {
    if (!req.user.familyId) return res.status(403).json({ success: false, message: 'Not in a family' });
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });

    const requests = await JoinRequest.find({ family: req.user.familyId, status: 'pending' })
      .populate('user', 'fullName email avatar');
    res.status(200).json({ success: true, data: { requests } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const approveJoinRequest = async (req, res) => {
  try {
    if (!req.user.familyId || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    
    const request = await JoinRequest.findById(req.params.id);
    if (!request || request.status !== 'pending' || String(request.family) !== String(req.user.familyId)) {
      return res.status(404).json({ success: false, message: 'Invalid request' });
    }

    request.status = 'approved';
    await request.save();

    // Add user to family
    const family = await Family.findById(req.user.familyId);
    const alreadyMember = family.members.some(
      (memberId) => String(memberId) === String(request.user)
    );
    if (!alreadyMember) {
      family.members.push(request.user);
      await family.save();
    }
    await User.findByIdAndUpdate(request.user, { familyId: req.user.familyId, role: 'member' });
    await FamilyMember.findOneAndUpdate(
      { family: req.user.familyId, user: request.user },
      { family: req.user.familyId, user: request.user, role: 'member', joinedVia: 'admin_add', isActive: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, message: 'Approved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const rejectJoinRequest = async (req, res) => {
  try {
    if (!req.user.familyId || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    
    const request = await JoinRequest.findById(req.params.id);
    if (!request || request.status !== 'pending' || String(request.family) !== String(req.user.familyId)) {
      return res.status(404).json({ success: false, message: 'Invalid request' });
    }

    request.status = 'rejected';
    await request.save();
    res.status(200).json({ success: true, message: 'Rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createFamily,
  getMyFamily,
  joinFamilyByCode,
  inviteMember,
  leaveFamily,
  updateFamily,
  updateMemberRole,
  updateMemberType,
  addLifeEvent,
  createJoinRequest,
  getJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
};
