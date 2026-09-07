const ParentalConsent = require('../models/ParentalConsent');

/**
 * Gate family content behind guardian approval for minors.
 *
 * The proposal requires parental approval for minors, and a self-declared
 * memberType of 'child' at registration is the child's own claim, not consent.
 * So a child account can authenticate and see its own consent status, but
 * cannot reach family content until a guardian approves it.
 *
 * Adults and elders are unaffected. The 403 carries a machine-readable
 * `code` so the app can show a "waiting for a guardian" screen rather than a
 * generic error.
 */
const requireParentalConsent = async (req, res, next) => {
  try {
    if (req.user?.memberType !== 'child') return next();
    if (!req.user.familyId) return next(); // no family yet — nothing to gate

    const consent = await ParentalConsent.findOne({
      familyId: req.user.familyId,
      child: req.user._id,
    }).select('status');

    if (consent?.status === 'approved') return next();

    return res.status(403).json({
      success: false,
      code: consent?.status === 'rejected' ? 'CONSENT_REJECTED' : 'CONSENT_PENDING',
      message:
        consent?.status === 'rejected'
          ? 'A guardian has not approved this account.'
          : 'This account is waiting for a parent or guardian to approve it.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Could not verify parental consent' });
  }
};

module.exports = { requireParentalConsent };
