const ParentalConsent = require('../models/ParentalConsent');
const User = require('../models/User');
const { notifyUsers } = require('../services/notificationService');
const { syncUserFamilyRoom } = require('../socket/familyRooms');
const logger = require('../utils/logger');

/** Admins and parents act as guardians for a family's minors. */
function isGuardian(user) {
  return user.role === 'admin' || user.role === 'parent';
}

/**
 * Open (or reopen) a consent request for a child who has joined a family, and
 * alert that family's guardians. Called from the family join/type flows, so a
 * minor never silently gains access without a guardian being asked.
 */
async function requestConsentForChild(childUser, familyId) {
  try {
    if (!childUser || String(childUser.memberType) !== 'child' || !familyId) return null;

    const consent = await ParentalConsent.findOneAndUpdate(
      { familyId, child: childUser._id },
      {
        $setOnInsert: { familyId, child: childUser._id },
        // A child re-joining a family starts a fresh decision.
        $set: { status: 'pending', decidedBy: null, decidedAt: null },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const guardians = await User.find({ familyId, role: { $in: ['admin', 'parent'] } }).select('_id');
    if (guardians.length > 0) {
      notifyUsers({
        userIds: guardians.map((g) => g._id),
        familyId,
        type: 'consent_requested',
        params: { child: childUser.fullName },
        title: 'A child account needs your approval',
        body: `${childUser.fullName} has joined and is waiting for a guardian to approve their account.`,
        data: { consentId: String(consent._id), childId: String(childUser._id) },
      });
    }

    return consent;
  } catch (err) {
    logger.error(`requestConsentForChild error: ${err.message}`);
    return null;
  }
}

// ──────────────────────────────────────────────────────────
// GET /api/consent/me — a child's own consent status
// ──────────────────────────────────────────────────────────
const getMyConsent = async (req, res) => {
  try {
    const { familyId, memberType, _id: userId } = req.user;

    if (memberType !== 'child') {
      return res.status(200).json({
        success: true,
        message: 'Consent is only required for child accounts',
        data: { required: false, status: 'not_applicable' },
      });
    }
    if (!familyId) {
      return res.status(200).json({
        success: true,
        data: { required: true, status: 'no_family' },
      });
    }

    const consent = await ParentalConsent.findOne({ familyId, child: userId })
      .populate('decidedBy', 'fullName');

    return res.status(200).json({
      success: true,
      data: {
        required: true,
        status: consent?.status ?? 'pending',
        decidedBy: consent?.decidedBy ?? null,
        decidedAt: consent?.decidedAt ?? null,
        note: consent?.note ?? '',
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// GET /api/consent/pending — guardians only
// ──────────────────────────────────────────────────────────
const getPendingConsents = async (req, res) => {
  try {
    const { familyId } = req.user;
    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family' });
    }
    if (!isGuardian(req.user)) {
      return res.status(403).json({ success: false, message: 'Only a family admin or parent can review child accounts' });
    }

    const consents = await ParentalConsent.find({ familyId, status: 'pending' })
      .populate('child', 'fullName email avatar dateOfBirth memberType');

    return res.status(200).json({ success: true, data: consents });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Shared approve/reject handler — both need the same guardian + family checks. */
async function decide(req, res, status) {
  try {
    const { familyId } = req.user;
    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family' });
    }
    if (!isGuardian(req.user)) {
      return res.status(403).json({ success: false, message: 'Only a family admin or parent can decide on a child account' });
    }

    // Scoped by familyId so a guardian can only decide within their own family.
    const consent = await ParentalConsent.findOne({ _id: req.params.id, familyId });
    if (!consent) {
      return res.status(404).json({ success: false, message: 'Consent request not found' });
    }

    // A guardian must never be able to approve their own account.
    if (String(consent.child) === String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You cannot decide on your own account' });
    }

    consent.status = status;
    consent.decidedBy = req.user._id;
    consent.decidedAt = new Date();
    if (req.body?.note !== undefined) consent.note = String(req.body.note).trim();
    await consent.save();
    await consent.populate('child', 'fullName email avatar');

    // Live chat follows the decision immediately: an approved child joins the
    // family room, a rejected one is removed from it.
    await syncUserFamilyRoom(req.app.get('io'), consent.child._id);

    notifyUsers({
      userIds: [consent.child._id],
      familyId,
      type: status === 'approved' ? 'consent_approved' : 'consent_rejected',
      params: { name: req.user.fullName },
      title: status === 'approved' ? 'Your account was approved' : 'Your account was not approved',
      body:
        status === 'approved'
          ? `${req.user.fullName} approved your family account.`
          : `${req.user.fullName} did not approve your family account.`,
      data: { consentId: String(consent._id) },
    });

    return res.status(200).json({
      success: true,
      message: status === 'approved' ? 'Child account approved' : 'Child account rejected',
      data: consent,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

const approveConsent = (req, res) => decide(req, res, 'approved');
const rejectConsent = (req, res) => decide(req, res, 'rejected');

module.exports = {
  requestConsentForChild,
  getMyConsent,
  getPendingConsents,
  approveConsent,
  rejectConsent,
  isGuardian,
};
