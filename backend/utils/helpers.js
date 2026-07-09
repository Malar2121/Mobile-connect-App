const { nanoid } = require('nanoid');

/**
 * Generates a unique, human-readable family invite code
 * Format: XXXX-XXXX (8 uppercase alphanumeric chars)
 */
const generateInviteCode = () => {
  const code = nanoid(8).toUpperCase();
  return `${code.slice(0, 4)}-${code.slice(4)}`;
};

/**
 * Calculate invite code expiry date
 */
const getInviteExpiry = () => {
  const hours = parseInt(process.env.INVITE_CODE_EXPIRY_HOURS || 48);
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

/**
 * Sanitize user object for public consumption (strip sensitive fields)
 */
const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.__v;
  return obj;
};

/**
 * Build MongoDB pagination options from query params
 */
const getPaginationOptions = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, parseInt(query.limit) || 20);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

module.exports = { generateInviteCode, getInviteExpiry, sanitizeUser, getPaginationOptions };
