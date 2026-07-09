const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vote: { type: String, enum: ['yes', 'maybe', 'no'], required: true },
  votedAt: { type: Date, default: Date.now },
});

const pollOptionSchema = new mongoose.Schema({
  dateTime: { type: Date, required: true },
  label: { type: String, trim: true }, // e.g. "Saturday Morning"
  votes: [voteSchema],
});

const eventPollSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
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
    question: {
      type: String,
      required: [true, 'Poll question is required'],
      trim: true,
      maxlength: [300, 'Question cannot exceed 300 characters'],
    },
    options: [pollOptionSchema],
    deadline: {
      type: Date,
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
    // Winning option selected manually or auto-calculated
    selectedOption: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EventPoll', eventPollSchema);
