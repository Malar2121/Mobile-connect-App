const mongoose = require('mongoose');

// A geofenced area (home, school, grandma's house...) for a family.
// When a tracked member enters or leaves a zone the family is notified.
const safeZoneSchema = new mongoose.Schema(
  {
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Zone name is required'],
      trim: true,
      maxlength: [60, 'Zone name cannot exceed 60 characters'],
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    // Radius in meters
    radius: {
      type: Number,
      required: true,
      min: [30, 'Radius must be at least 30 meters'],
      max: [10000, 'Radius cannot exceed 10 km'],
    },
    type: {
      type: String,
      enum: ['home', 'school', 'work', 'relative', 'other'],
      default: 'other',
    },
    notifyOnEnter: { type: Boolean, default: true },
    notifyOnExit: { type: Boolean, default: true },
    // Empty array = zone applies to every member
    appliesTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

safeZoneSchema.index({ familyId: 1, createdAt: -1 });

module.exports = mongoose.model('SafeZone', safeZoneSchema);
