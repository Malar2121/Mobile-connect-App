const mongoose = require('mongoose');

// Rejects malformed MongoDB ObjectIds with 400 before they reach a
// controller, so per-controller try/catch blocks can no longer turn a
// CastError into a 500 (fix for BUG-L1).
const validateObjectId = (...paramNames) => (req, res, next) => {
  for (const name of paramNames) {
    const value = req.params[name];
    if (value !== undefined && !mongoose.isValidObjectId(value)) {
      return res.status(400).json({ success: false, message: `Invalid ${name} parameter` });
    }
  }
  return next();
};

// router.param handler variant — register once per router:
//   router.param('id', objectIdParam)
const objectIdParam = (req, res, next, value, name) => {
  if (!mongoose.isValidObjectId(value)) {
    return res.status(400).json({ success: false, message: `Invalid ${name} parameter` });
  }
  return next();
};

module.exports = { validateObjectId, objectIdParam };
