const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema(
  {
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    caption: {
      type: String,
      trim: true,
      default: '',
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    album: {
      type: String,
      trim: true,
      default: '',
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    location: {
      type: String,
      trim: true,
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    // Proposal §8: members approve shared photos and videos. New uploads start
    // 'pending' (set by the upload controller). The schema default of
    // 'approved' covers memories created before approval existed, so they stay
    // visible without a data migration.
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    review: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      reviewedAt: { type: Date, default: null },
      reason: { type: String, trim: true, maxlength: 300, default: '' },
      // True when nobody else in the family could review the upload.
      automatic: { type: Boolean, default: false },
    },
    // Stored size in bytes, counted against the family storage quota (§5.5).
    bytes: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
  }
);

memorySchema.index({ familyId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Memory', memorySchema);
