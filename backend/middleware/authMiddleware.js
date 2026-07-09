const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Auth Middleware
 * ─────────────────────────────────────────────────────────
 * Verifies the Bearer JWT access token from the Authorization header.
 * On success, attaches the full user object to req.user and calls next().
 * On failure, returns a 401 JSON response.
 *
 * Usage in routes:
 *   const { protect } = require('../middleware/authMiddleware');
 *   router.get('/me', protect, getMe);
 */
const protect = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — no token provided',
      });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const message =
        err.name === 'TokenExpiredError'
          ? 'Token has expired — please login again'
          : 'Invalid token';
      return res.status(401).json({ success: false, message });
    }

    // 3. Find user in DB
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated' });
    }

    // 4. Attach user to request and continue
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Authentication failed' });
  }
};

/**
 * Role-based access control
 * Usage: router.delete('/:id', protect, authorize('admin', 'parent'), deleteUser)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied — role '${req.user.role}' is not permitted`,
    });
  }
  next();
};

module.exports = { protect, authorize };
