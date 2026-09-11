const mongoose = require('mongoose');

const STORY_CATEGORIES = ['story', 'tradition', 'origin', 'milestone', 'recipe'];

/**
 * A written family story kept in the memory archive (proposal Objective 4:
 * "a memory archive for storing photos, videos, and stories").
 */
const storySchema = new mongoose.Schema(
  {
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    category: {
      type: String,
      enum: STORY_CATEGORIES,
      default: 'story',
    },
    // When the story happened, if the author knows — distinct from createdAt.
    happenedOn: {
      type: Date,
      default: null,
    },
    // Optional link to a family event the story is about.
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },
  },
  { timestamps: true },
);

storySchema.index({ familyId: 1, createdAt: -1 });

module.exports = mongoose.model('Story', storySchema);
module.exports.STORY_CATEGORIES = STORY_CATEGORIES;
