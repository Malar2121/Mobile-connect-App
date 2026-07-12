const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in queries by default
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['admin', 'parent', 'child', 'member'],
      default: 'member',
    },
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family',
      default: null,
    },
    // Elder mode: signals the mobile client to show simplified UI
    elderMode: {
      type: Boolean,
      default: false,
    },
    // FCM push notification tokens (one per device)
    fcmTokens: [
      {
        token: String,
        device: {
          type: String,
          enum: ['ios', 'android', 'web'],
          default: 'android',
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    refreshToken: {
      type: String,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    pushToken: {
      type: String,
    },
    pushPreferences: {
      chat: { type: Boolean, default: true },
      events: { type: Boolean, default: true },
      location: { type: Boolean, default: true },
      memories: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// ──────────────────────────────────────────────────────────
// Hash password before saving (only when modified)
// ──────────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ──────────────────────────────────────────────────────────
// Instance method: compare plain password with hashed one
// ──────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
