const ParentalConsent = require('../models/ParentalConsent');

/**
 * Who may see and change family content.
 *
 * This is the single rule shared by the REST consent middleware and the
 * Socket.IO server, so the two transports can never disagree about what a
 * guest or an unapproved minor is allowed to do.
 */

/**
 * Consent state for a user: 'not_required' for adults, elders and anyone not
 * yet in a family; otherwise the child's guardian decision.
 */
async function getConsentStatus(user) {
  if (!user || user.memberType !== 'child' || !user.familyId) return 'not_required';

  const consent = await ParentalConsent.findOne({
    familyId: user.familyId,
    child: user._id,
  })
    .select('status')
    .lean();

  if (consent?.status === 'approved') return 'approved';
  return consent?.status === 'rejected' ? 'rejected' : 'pending';
}

/**
 * Resolve read/write access to a user's family content.
 * `code` matches the machine-readable codes the REST API already returns.
 */
async function resolveFamilyAccess(user) {
  if (!user?.familyId) {
    return { canRead: false, canWrite: false, code: 'NO_FAMILY' };
  }

  const consent = await getConsentStatus(user);
  if (consent === 'pending' || consent === 'rejected') {
    return {
      canRead: false,
      canWrite: false,
      code: consent === 'rejected' ? 'CONSENT_REJECTED' : 'CONSENT_PENDING',
    };
  }

  if (user.role === 'guest') {
    return { canRead: true, canWrite: false, code: 'GUEST_READ_ONLY' };
  }

  return { canRead: true, canWrite: true, code: null };
}

module.exports = { getConsentStatus, resolveFamilyAccess };
