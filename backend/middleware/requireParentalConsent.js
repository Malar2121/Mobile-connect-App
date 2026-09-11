const { getConsentStatus } = require('../services/accessPolicy');

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
 * generic error. The rule itself lives in services/accessPolicy.js, which the
 * Socket.IO server shares.
 */
const requireParentalConsent = async (req, res, next) => {
  try {
    const status = await getConsentStatus(req.user);
    if (status === 'not_required' || status === 'approved') return next();

    return res.status(403).json({
      success: false,
      code: status === 'rejected' ? 'CONSENT_REJECTED' : 'CONSENT_PENDING',
      message:
        status === 'rejected'
          ? 'A guardian has not approved this account.'
          : 'This account is waiting for a parent or guardian to approve it.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Could not verify parental consent' });
  }
};

module.exports = { requireParentalConsent };
