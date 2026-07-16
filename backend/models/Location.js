const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    accuracy: { type: Number, default: null },
    heading: { type: Number, default: null },
    speed: { type: Number, default: null },
    battery: { type: Number, default: null },
    // Adults may pause sharing; children/elders cannot (enforced in controller)
    isSharing: { type: Boolean, default: true },
    // Safe zones the user is currently inside — used to detect enter/exit
    currentZoneIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SafeZone' }],
  },
  {
    timestamps: true,
  },
);

locationSchema.index({ familyId: 1, updatedAt: -1 });

module.exports = mongoose.model('Location', locationSchema);
