const mongoose = require('mongoose');

/**
 * A record that one specific reminder has already been dispatched.
 *
 * This is the scheduler's duplicate guard. The unique compound index below is
 * what actually prevents double-sending: the sweep tries to insert first and
 * only notifies if the insert succeeded, so a server restart, an overlapping
 * sweep, or two instances running at once can never send the same reminder
 * twice — the second insert fails with a duplicate-key error.
 */
const sentReminderSchema = new mongoose.Schema(
  {
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
    },
    // 'event' | 'celebration' | 'birthday'
    sourceType: {
      type: String,
      required: true,
    },
    // Event/Celebration _id, or the virtual "birthday_<userId>" key.
    sourceId: {
      type: String,
      required: true,
    },
    // The specific dated occurrence this reminder was for — so next year's
    // birthday is a different row and does get its own reminder.
    occurrenceDate: {
      type: Date,
      required: true,
    },
    daysBefore: {
      type: Number,
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

sentReminderSchema.index(
  { sourceType: 1, sourceId: 1, occurrenceDate: 1, daysBefore: 1 },
  { unique: true },
);

// Old rows have no value once their occurrence has passed; expire after 400
// days so the collection cannot grow without bound.
sentReminderSchema.index({ sentAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 400 });

module.exports = mongoose.model('SentReminder', sentReminderSchema);
