const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema(
  {
    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'parent', 'member', 'child'],
      default: 'member',
    },
    // Family-specific relationship name (e.g., "Dad", "Uncle Bob")
    nickname: {
      type: String,
      trim: true,
      maxlength: [50, 'Nickname cannot exceed 50 characters'],
    },
    // Family tree relationship type
    relationshipType: {
      type: String,
      enum: [
        'parent', 'child', 'grandparent', 'grandchild',
        'sibling', 'spouse', 'uncle', 'aunt', 'cousin',
        'nephew', 'niece', 'other'
      ],
      default: 'other',
    },
    // Whom this member is related to within the family
    relatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    joinedVia: {
      type: String,
      enum: ['invite_code', 'admin_add', 'creator'],
      default: 'invite_code',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Unique member per family
familyMemberSchema.index({ family: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('FamilyMember', familyMemberSchema);
