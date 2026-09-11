const Invitation = require('../models/Invitation');
const Family = require('../models/Family');
const User = require('../models/User');
const FamilyMember = require('../models/FamilyMember');
const { sendInvitationEmail, isConfigured } = require('../services/mailService');
const { requestConsentForChild } = require('./consentController');
const { syncUserFamilyRoom } = require('../socket/familyRooms');

const EXPIRY_HOURS = parseInt(process.env.INVITE_CODE_EXPIRY_HOURS, 10) || 48;
const INVITABLE_ROLES = ['member', 'parent', 'guest'];

/** Admins and parents may invite; ordinary members and guests may not. */
function canInvite(user) {
  return user.role === 'admin' || user.role === 'parent';
}

/** Shape an invitation for a response — never exposes the token hash. */
function present(inv) {
  return {
    _id: inv._id,
    email: inv.email,
    role: inv.role,
    status: inv.isUsable() ? 'pending' : inv.status === 'pending' ? 'expired' : inv.status,
    expiresAt: inv.expiresAt,
    emailSent: inv.emailSent,
    invitedBy: inv.invitedBy,
    acceptedAt: inv.acceptedAt,
    createdAt: inv.createdAt,
  };
}

// ──────────────────────────────────────────────────────────
// POST /api/family/invitations   { email, role? }
// ──────────────────────────────────────────────────────────
const createInvitation = async (req, res) => {
  try {
    const { familyId, _id: userId, fullName } = req.user;
    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family to invite someone' });
    }
    if (!canInvite(req.user)) {
      return res.status(403).json({ success: false, message: 'Only a family admin or parent can send invitations' });
    }

    const email = String(req.body.email ?? '').trim().toLowerCase();
    const role = req.body.role ?? 'member';

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required' });
    }
    if (!INVITABLE_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `role must be one of: ${INVITABLE_ROLES.join(', ')}. Admin rights cannot be granted by invitation.`,
      });
    }

    // Someone already in this family does not need an invitation, and telling
    // an inviter that an address belongs to another family would leak it — so
    // both cases return the same neutral refusal.
    const existing = await User.findOne({ email });
    if (existing?.familyId) {
      return res.status(409).json({
        success: false,
        message: 'That person already belongs to a family.',
      });
    }

    const family = await Family.findById(familyId);
    if (!family) return res.status(404).json({ success: false, message: 'Family not found' });

    const { raw, hash } = Invitation.generateToken();
    const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 3600 * 1000);

    // Re-inviting the same address refreshes the invitation rather than
    // stacking duplicates, and invalidates the previous token.
    const invitation = await Invitation.findOneAndUpdate(
      { familyId, email },
      {
        familyId,
        email,
        role,
        tokenHash: hash,
        invitedBy: userId,
        status: 'pending',
        expiresAt,
        acceptedBy: null,
        acceptedAt: null,
        emailSent: false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const delivery = await sendInvitationEmail({
      to: email,
      familyName: family.name,
      inviterName: fullName,
      token: raw,
      expiresAt,
    });

    // Only record a send that a transport actually accepted.
    if (delivery.sent) {
      invitation.emailSent = true;
      await invitation.save();
    }

    return res.status(201).json({
      success: true,
      message: delivery.sent
        ? `Invitation sent to ${email}`
        : 'Invitation created, but it could not be emailed. Share the link another way or configure SMTP.',
      data: {
        invitation: present(invitation),
        emailSent: delivery.sent,
        deliveryReason: delivery.sent ? null : delivery.reason,
        mailConfigured: isConfigured(),
        // The raw token goes back to the inviter only when email failed, so a
        // family is never locked out by a mail outage. It is never returned
        // once the email has actually been delivered.
        token: delivery.sent ? undefined : raw,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(422).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// GET /api/family/invitations
// ──────────────────────────────────────────────────────────
const listInvitations = async (req, res) => {
  try {
    const { familyId } = req.user;
    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family' });
    }
    if (!canInvite(req.user)) {
      return res.status(403).json({ success: false, message: 'Only a family admin or parent can view invitations' });
    }

    const invitations = await Invitation.find({ familyId })
      .populate('invitedBy', 'fullName')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: invitations.map(present) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// DELETE /api/family/invitations/:id  — revoke
// ──────────────────────────────────────────────────────────
const revokeInvitation = async (req, res) => {
  try {
    const { familyId } = req.user;
    if (!canInvite(req.user)) {
      return res.status(403).json({ success: false, message: 'Only a family admin or parent can revoke invitations' });
    }

    // Scoped by familyId so one family cannot revoke another's invitation.
    const invitation = await Invitation.findOne({ _id: req.params.id, familyId });
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }
    if (invitation.status === 'accepted') {
      return res.status(400).json({ success: false, message: 'That invitation has already been accepted' });
    }

    invitation.status = 'revoked';
    await invitation.save();

    return res.status(200).json({ success: true, message: 'Invitation revoked', data: present(invitation) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// GET /api/family/invitations/verify/:token   (auth required)
// Lets the app show which family an invitation is for before accepting.
// Returns the family name only — never its members or id.
// ──────────────────────────────────────────────────────────
const verifyInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findOne({
      tokenHash: Invitation.hashToken(req.params.token),
    }).populate('familyId', 'name');

    if (!invitation) {
      return res.status(404).json({ success: false, code: 'INVALID', message: 'This invitation link is not valid.' });
    }
    if (invitation.status === 'revoked') {
      return res.status(410).json({ success: false, code: 'REVOKED', message: 'This invitation has been revoked.' });
    }
    if (invitation.status === 'accepted') {
      return res.status(410).json({ success: false, code: 'USED', message: 'This invitation has already been used.' });
    }
    if (invitation.isExpired()) {
      return res.status(410).json({ success: false, code: 'EXPIRED', message: 'This invitation has expired.' });
    }

    return res.status(200).json({
      success: true,
      data: { familyName: invitation.familyId?.name ?? 'a family', role: invitation.role, expiresAt: invitation.expiresAt },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// POST /api/family/invitations/accept   { token }
// ──────────────────────────────────────────────────────────
const acceptInvitation = async (req, res) => {
  try {
    const token = String(req.body.token ?? '').trim();
    if (!token) {
      return res.status(400).json({ success: false, message: 'An invitation token is required' });
    }
    if (req.user.familyId) {
      return res.status(400).json({
        success: false,
        message: 'You already belong to a family. Leave it before accepting another invitation.',
      });
    }

    const invitation = await Invitation.findOne({ tokenHash: Invitation.hashToken(token) });
    if (!invitation) {
      return res.status(404).json({ success: false, code: 'INVALID', message: 'This invitation link is not valid.' });
    }
    if (invitation.status === 'revoked') {
      return res.status(410).json({ success: false, code: 'REVOKED', message: 'This invitation has been revoked.' });
    }
    if (invitation.status === 'accepted') {
      return res.status(410).json({ success: false, code: 'USED', message: 'This invitation has already been used.' });
    }
    if (invitation.isExpired()) {
      return res.status(410).json({ success: false, code: 'EXPIRED', message: 'This invitation has expired.' });
    }

    // The invitation was addressed to a specific person. Letting anyone who
    // obtains the link redeem it would defeat the point of inviting by email.
    if (invitation.email !== String(req.user.email).toLowerCase()) {
      return res.status(403).json({
        success: false,
        code: 'WRONG_ACCOUNT',
        message: 'This invitation was sent to a different email address.',
      });
    }

    const family = await Family.findById(invitation.familyId);
    if (!family) {
      return res.status(404).json({ success: false, message: 'That family no longer exists.' });
    }

    if (!family.members.some((m) => String(m) === String(req.user._id))) {
      family.members.push(req.user._id);
      await family.save();
    }

    await User.findByIdAndUpdate(req.user._id, { familyId: family._id, role: invitation.role });
    await FamilyMember.findOneAndUpdate(
      { family: family._id, user: req.user._id },
      {
        family: family._id,
        user: req.user._id,
        role: invitation.role,
        joinedVia: 'email_invite',
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Single use: mark it consumed so the same link cannot be replayed.
    invitation.status = 'accepted';
    invitation.acceptedBy = req.user._id;
    invitation.acceptedAt = new Date();
    await invitation.save();

    // A minor accepting an invitation still needs guardian approval.
    await requestConsentForChild(req.user, family._id);
    await syncUserFamilyRoom(req.app.get('io'), req.user._id);

    await family.populate('members', 'fullName email avatar role memberType dateOfBirth');

    return res.status(200).json({
      success: true,
      message: `You have joined the "${family.name}" family!`,
      data: { family, consentRequired: req.user.memberType === 'child' },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createInvitation,
  listInvitations,
  revokeInvitation,
  verifyInvitation,
  acceptInvitation,
};
