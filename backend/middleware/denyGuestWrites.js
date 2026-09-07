/**
 * Enforce the read-only guest role from proposal §6.2.
 *
 * A guest is an extended relative who can see the family's shared content but
 * must not change it. Rather than sprinkling role checks through every
 * controller (and inevitably missing one), any state-changing method is
 * refused for guests at the route layer. Reads pass through untouched.
 *
 * Safe methods are allowed. SOS is the deliberate exception — a guest in
 * danger must still be able to call for help, the same reasoning that keeps
 * SOS available to minors.
 */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const ALWAYS_ALLOWED = [/^\/sos$/];

const denyGuestWrites = (req, res, next) => {
  if (req.user?.role !== 'guest') return next();
  if (SAFE_METHODS.has(req.method)) return next();
  if (ALWAYS_ALLOWED.some((re) => re.test(req.path))) return next();

  return res.status(403).json({
    success: false,
    code: 'GUEST_READ_ONLY',
    message: 'Guests can view family content but cannot change it.',
  });
};

module.exports = { denyGuestWrites };
