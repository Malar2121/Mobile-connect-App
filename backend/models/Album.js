const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema(
  {
    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Album title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    coverMemory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Memory',
      default: null,
    },
    mediaCount: {
      type: Number,
      default: 0,
    },
    isShared: {
      type: Boolean,
      default: false, // if true, shareable link is active
    },
    shareLink: {
      type: String,
      default: null,
    },
    // Event linked to this album (optional)
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },
  },
  { timestamps: true }
);

albumSchema.index({ family: 1, createdAt: -1 });

module.exports = mongoose.model('Album', albumSchema);
