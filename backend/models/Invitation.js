const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * An email invitation to join a family (proposal §6.3 — "secure onboarding via
 * email or QR code").
 *
 * Only a SHA-256 hash of the token is stored, the same way a password reset
 * token is handled: the raw token exists only in the email that was sent, so a
 * leaked database dump cannot be used to join anyone's family. Tokens are
 * single-use and expire.
 */
const invitationSchema = new mongoose.Schema(
  {
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
    },
    email: {
      type: String,
      required: [true, 'An email address is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    // SHA-256 of the raw token. The raw value is never persisted.
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Role the invitee receives on acceptance. Never 'admin' — an invitation
    // must not be a route to administrative control of a family.
    role: {
      type: String,
      enum: ['member', 'parent', 'guest'],
      default: 'member',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'revoked'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    // Whether a mail transport actually accepted the message. Never set true
    // optimistically — an unsent invitation must not look sent.
    emailSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// One live invitation per email per family; re-inviting refreshes it in place.
invitationSchema.index({ familyId: 1, email: 1 }, { unique: true });
invitationSchema.index({ familyId: 1, status: 1 });

/** Generate a raw token and its stored hash. The raw value is returned once. */
invitationSchema.statics.generateToken = function generateToken() {
  const raw = crypto.randomBytes(32).toString('hex');
  return { raw, hash: crypto.createHash('sha256').update(raw).digest('hex') };
};

invitationSchema.statics.hashToken = function hashToken(raw) {
  return crypto.createHash('sha256').update(String(raw)).digest('hex');
};

invitationSchema.methods.isExpired = function isExpired() {
  return this.expiresAt.getTime() < Date.now();
};

/** Usable means pending and not yet expired. */
invitationSchema.methods.isUsable = function isUsable() {
  return this.status === 'pending' && !this.isExpired();
};

module.exports = mongoose.model('Invitation', invitationSchema);
