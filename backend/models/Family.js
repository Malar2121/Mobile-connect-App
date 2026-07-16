const mongoose = require('mongoose');

const familySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Family name is required'],
      trim: true,
      maxlength: [100, 'Family name cannot exceed 100 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Embedded member list — stores User ObjectIds directly
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    inviteCode: {
      type: String,
      unique: true,
      required: true,
    },
    photoUrl: {
      type: String,
      default: '',
    },
    // The invite code itself is the gate for joining (FR-06). Admin
    // approval of joins is an opt-in extra — defaulting it to true turns
    // every invite-code join into a pending request and breaks the
    // documented instant-join flow.
    privacySettings: {
      type: Object,
      default: {
        discoverable: false,
        requireApproval: false,
      },
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Index for fast invite-code lookups
familySchema.index({ inviteCode: 1 });

module.exports = mongoose.model('Family', familySchema);
