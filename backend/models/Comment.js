const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  family: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
  onModel: { type: String, required: true, enum: ['Event', 'Memory'] },
  onDocument: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'onModel' },
  content: { type: String, required: true, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
