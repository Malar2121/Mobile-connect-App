const Family = require('../models/Family');
const User = require('../models/User');
const FamilyMember = require('../models/FamilyMember');
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
    await family.populate('members', 'fullName email avatar role');
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
      .populate('members', 'fullName email avatar role lastSeen createdAt')
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

    // User can't join if they already belong to a family
    if (req.user.familyId) {
      return res.status(400).json({
        success: false,
        message: 'You already belong to a family. Leave it before joining another.',
      });
    }

    // Find family by invite code
    const family = await Family.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (!family) {
      return res.status(404).json({ success: false, message: 'Invalid invite code' });
    }

    // Prevent duplicate membership
    const alreadyMember = family.members.some(
      (memberId) => String(memberId) === String(req.user._id)
    );
    if (alreadyMember) {
      return res.status(409).json({
        success: false,
        message: 'You are already a member of this family',
      });
    }

    // Add user to members array
    family.members.push(req.user._id);
    await family.save();

    // Update user's familyId
    await User.findByIdAndUpdate(req.user._id, { familyId: family._id });

    // Create the joining member's FamilyMember record so they appear in the
    // family tree (relationship defaults to 'other' until edited).
    await FamilyMember.findOneAndUpdate(
      { family: family._id, user: req.user._id },
      { family: family._id, user: req.user._id, role: 'member', joinedVia: 'invite_code', isActive: true },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Populate for response
    await family.populate('members', 'fullName email avatar role');
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

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
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

module.exports = {
  createFamily,
  getMyFamily,
  joinFamilyByCode,
  inviteMember,
  leaveFamily,
};
