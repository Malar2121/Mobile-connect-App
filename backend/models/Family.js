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
    // Shared family history journal: origins, traditions and the stories
    // passed down through generations, identical on every member's device.
    history: {
      origins: { type: String, default: '', maxlength: 5000 },
      traditions: { type: String, default: '', maxlength: 5000 },
      culturalNotes: { type: String, default: '', maxlength: 5000 },
      importantEvents: { type: String, default: '', maxlength: 5000 },
      achievements: { type: String, default: '', maxlength: 5000 },
      historicalMemories: { type: String, default: '', maxlength: 5000 },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      updatedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// `unique: true` on inviteCode already creates the index for invite-code
// lookups; declaring it again made Mongoose warn about a duplicate index.

module.exports = mongoose.model('Family', familySchema);
