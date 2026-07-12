const mongoose = require('mongoose');

const legacyProfileSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
  biography: { type: String },
  deathDate: { type: Date },
  burialLocation: { type: String },
  tributes: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    date: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

module.exports = mongoose.model('LegacyProfile', legacyProfileSchema);
