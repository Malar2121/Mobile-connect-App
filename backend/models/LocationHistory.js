const mongoose = require('mongoose');

// Rolling trail of past positions per user, powering trip/location history.
// Documents expire automatically after 30 days to bound storage.
const locationHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
    },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number, default: null },
    speed: { type: Number, default: null },
    battery: { type: Number, default: null },
    recordedAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 30, // TTL: 30 days
    },
  },
  { timestamps: false },
);

locationHistorySchema.index({ userId: 1, recordedAt: -1 });
locationHistorySchema.index({ familyId: 1, recordedAt: -1 });

module.exports = mongoose.model('LocationHistory', locationHistorySchema);
