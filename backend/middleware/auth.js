/**
 * Backward-compatible re-export.
 * protect and authorize now live in authMiddleware.js.
 * Other route files that already import from auth.js continue to work.
 */
const { protect, authorize } = require('./authMiddleware');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Ensure the user belongs to a family before accessing family resources
 */
const requireFamily = (req, res, next) => {
  if (!req.user.familyId) {
    return errorResponse(res, 'You must be part of a family to access this resource', 403);
  }
  next();
};

module.exports = { protect, authorize, requireFamily };
