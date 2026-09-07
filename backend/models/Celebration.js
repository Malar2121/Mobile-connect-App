const mongoose = require('mongoose');

/**
 * A recurring or one-off family occasion — anniversaries, cultural festivals,
 * and any other date the family wants tracked and reminded about.
 *
 * Birthdays are deliberately NOT stored here. They are derived from
 * User.dateOfBirth at read time (see utils/celebrations.js), so a member's
 * birthday can never drift out of sync with their profile and there is no
 * duplicate copy to maintain.
 */
const celebrationSchema = new mongoose.Schema(
  {
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
    },
    type: {
      type: String,
      enum: ['anniversary', 'cultural', 'other'],
      required: [true, 'Celebration type is required'],
    },
    title: {
      type: String,
      required: [true, 'Celebration title is required'],
      trim: true,
      maxlength: [140, 'Title cannot exceed 140 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    // The occasion's original date — e.g. the wedding day for an anniversary.
    // For annual celebrations only month/day drive future occurrences; the
    // year is kept so the app can show "12th anniversary".
    date: {
      type: Date,
      required: [true, 'Celebration date is required'],
    },
    recurrence: {
      type: String,
      enum: ['annual', 'once'],
      default: 'annual',
    },
    // Optional link to the members the occasion is about (e.g. the couple).
    relatedMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Days before the occasion to send a reminder. [] disables reminders.
    reminderDaysBefore: {
      type: [Number],
      default: [1],
      validate: {
        validator: (arr) => arr.every((n) => Number.isInteger(n) && n >= 0 && n <= 365),
        message: 'reminderDaysBefore must be whole numbers between 0 and 365',
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

// Family-scoped listing is the only read pattern, and reminders sweep by date.
celebrationSchema.index({ familyId: 1, date: 1 });
// One occasion of a given type/title/date per family — blocks accidental dupes.
celebrationSchema.index({ familyId: 1, type: 1, title: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Celebration', celebrationSchema);
