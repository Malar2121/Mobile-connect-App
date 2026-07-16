const Location = require('../models/Location');
const LocationHistory = require('../models/LocationHistory');
const SafeZone = require('../models/SafeZone');
const User = require('../models/User');
const { notifyFamilyMembers } = require('../services/notificationService');
const { haversineMeters, isValidCoordinate } = require('../utils/geo');

// History throttle: record a new trail point only if the last one is older
// than this or the user moved further than HISTORY_MIN_DISTANCE_M.
const HISTORY_MIN_INTERVAL_MS = 3 * 60 * 1000;
const HISTORY_MIN_DISTANCE_M = 100;

// ──────────────────────────────────────────────────────────
// Helper: append a trail point (throttled by time + distance)
// ──────────────────────────────────────────────────────────
const recordHistoryPoint = async ({ userId, familyId, latitude, longitude, accuracy, speed, battery }) => {
  const last = await LocationHistory.findOne({ userId }).sort({ recordedAt: -1 });
  if (last) {
    const age = Date.now() - new Date(last.recordedAt).getTime();
    const moved = haversineMeters(last.latitude, last.longitude, latitude, longitude);
    if (age < HISTORY_MIN_INTERVAL_MS && moved < HISTORY_MIN_DISTANCE_M) return;
  }
  await LocationHistory.create({ userId, familyId, latitude, longitude, accuracy, speed, battery });
};

// ──────────────────────────────────────────────────────────
// Helper: detect safe-zone enter/exit transitions and notify
// ──────────────────────────────────────────────────────────
const processGeofences = async ({ req, userId, fullName, familyId, latitude, longitude, previousZoneIds }) => {
  const zones = await SafeZone.find({ familyId, isActive: true });
  if (!zones.length) return [];

  const applicable = zones.filter(
    (z) => !z.appliesTo?.length || z.appliesTo.some((id) => String(id) === String(userId)),
  );

  const insideIds = applicable
    .filter((z) => haversineMeters(z.latitude, z.longitude, latitude, longitude) <= z.radius)
    .map((z) => String(z._id));

  const prevIds = (previousZoneIds || []).map(String);
  const entered = applicable.filter((z) => insideIds.includes(String(z._id)) && !prevIds.includes(String(z._id)));
  const exited = applicable.filter((z) => prevIds.includes(String(z._id)) && !insideIds.includes(String(z._id)));

  const io = req.app.get('io');
  const fireAlert = (zone, action) => {
    const title = action === 'enter' ? `${fullName} arrived at ${zone.name}` : `${fullName} left ${zone.name}`;
    // Fire-and-forget so push latency never delays the location response
    notifyFamilyMembers({
      familyId,
      excludeUserId: userId,
      type: 'geofence_alert',
      title,
      body: action === 'enter' ? 'Safe zone entered' : 'Safe zone exited',
      data: { userId: String(userId), zoneId: String(zone._id), zoneName: zone.name, action },
    }).catch(() => {});
    if (io) {
      io.to(`family_${familyId}`).emit('zone_alert', {
        userId,
        fullName,
        zoneId: zone._id,
        zoneName: zone.name,
        zoneType: zone.type,
        action,
        createdAt: new Date().toISOString(),
      });
    }
  };

  entered.filter((z) => z.notifyOnEnter).forEach((z) => fireAlert(z, 'enter'));
  exited.filter((z) => z.notifyOnExit).forEach((z) => fireAlert(z, 'exit'));

  return insideIds;
};

// ══════════════════════════════════════════════════════════
// POST /api/location/update
// Upsert latest position, broadcast live, keep the trail and
// evaluate safe-zone transitions.
// ══════════════════════════════════════════════════════════
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, accuracy, heading, speed, battery } = req.body;
    const { familyId, _id: userId, fullName } = req.user;

    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family to share location' });
    }

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    if (!isValidCoordinate(latitude, longitude)) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates' });
    }

    const previous = await Location.findOne({ userId }).select('currentZoneIds');

    const insideZoneIds = await processGeofences({
      req,
      userId,
      fullName,
      familyId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      previousZoneIds: previous?.currentZoneIds,
    });

    const payload = {
      familyId,
      latitude,
      longitude,
      currentZoneIds: insideZoneIds,
      isSharing: !req.user.locationSharingPaused,
      updatedAt: Date.now(),
    };
    if (accuracy != null) payload.accuracy = Number(accuracy);
    if (heading != null) payload.heading = Number(heading);
    if (speed != null) payload.speed = Number(speed);
    if (battery != null) payload.battery = Number(battery);

    const location = await Location.findOneAndUpdate({ userId }, payload, { new: true, upsert: true }).populate(
      'userId',
      'fullName avatar memberType',
    );

    recordHistoryPoint({
      userId,
      familyId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: accuracy != null ? Number(accuracy) : null,
      speed: speed != null ? Number(speed) : null,
      battery: battery != null ? Number(battery) : null,
    }).catch(() => {});

    const io = req.app.get('io');
    if (io && location.isSharing !== false) {
      io.to(`family_${familyId}`).emit('location_update', location);
    }

    return res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: location,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// GET /api/location/family
// Latest positions of every member who is currently sharing.
// ══════════════════════════════════════════════════════════
const getFamilyLocations = async (req, res) => {
  try {
    const { familyId } = req.user;

    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family to view locations' });
    }

    const locations = await Location.find({ familyId })
      .populate('userId', 'fullName email avatar memberType locationSharingPaused')
      .sort({ updatedAt: -1 });

    // Members who paused sharing stay hidden from the family map
    const visible = locations.filter((l) => !l.userId?.locationSharingPaused);

    return res.status(200).json({
      success: true,
      message: 'Family locations retrieved',
      data: visible,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// POST /api/location/sharing
// Pause/resume location sharing. Safety policy: children and
// elders cannot pause — guardians must always see them.
// ══════════════════════════════════════════════════════════
const setSharing = async (req, res) => {
  try {
    const { enabled } = req.body;
    const { familyId, _id: userId, memberType } = req.user;

    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family' });
    }

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, message: 'enabled must be true or false' });
    }

    if (!enabled && (memberType === 'child' || memberType === 'elder')) {
      return res.status(403).json({
        success: false,
        message: 'Location sharing cannot be turned off for children and elders — family safety policy',
      });
    }

    // Preference lives on the user so it survives even before the first
    // location document exists; the Location doc mirrors it when present.
    await User.findByIdAndUpdate(userId, { locationSharingPaused: !enabled });
    const location = await Location.findOneAndUpdate(
      { userId },
      { isSharing: enabled },
      { new: true, upsert: false },
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`family_${familyId}`).emit('location_sharing_changed', {
        userId,
        isSharing: enabled,
      });
    }

    return res.status(200).json({
      success: true,
      message: enabled ? 'Location sharing resumed' : 'Location sharing paused',
      data: { isSharing: enabled, location },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// GET /api/location/history/:userId?hours=24
// Trail of a member. Allowed for: self, admins, parents, or
// anyone in the family when the target is a child or elder.
// ══════════════════════════════════════════════════════════
const getLocationHistory = async (req, res) => {
  try {
    const { userId: targetId } = req.params;
    const { familyId, _id: requesterId, role } = req.user;

    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family' });
    }

    const hours = Math.min(Math.max(parseInt(req.query.hours, 10) || 24, 1), 72);

    const target = await User.findOne({ _id: targetId, familyId }).select('fullName memberType');
    if (!target) {
      return res.status(404).json({ success: false, message: 'Member not found in your family' });
    }

    const isSelf = String(requesterId) === String(targetId);
    const isGuardian = role === 'admin' || role === 'parent';
    const targetIsTracked = target.memberType === 'child' || target.memberType === 'elder';

    if (!isSelf && !isGuardian && !targetIsTracked) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this member\'s history' });
    }

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const points = await LocationHistory.find({ userId: targetId, familyId, recordedAt: { $gte: since } })
      .sort({ recordedAt: 1 })
      .limit(500);

    return res.status(200).json({
      success: true,
      message: 'Location history retrieved',
      data: {
        member: { _id: target._id, fullName: target.fullName, memberType: target.memberType },
        hours,
        points,
      },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid member id' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// GET /api/location/:userId
// ══════════════════════════════════════════════════════════
const getUserLocation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { familyId } = req.user;

    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family' });
    }

    const location = await Location.findOne({ userId, familyId }).populate('userId', 'fullName avatar memberType');

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location unavailable or user not in family' });
    }

    return res.status(200).json({
      success: true,
      message: 'User location retrieved',
      data: location,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid member id' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// POST /api/location/sos
// ══════════════════════════════════════════════════════════
const sendSOS = async (req, res) => {
  try {
    const { latitude, longitude, message } = req.body;
    const { familyId, _id: userId, fullName } = req.user;

    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family to send SOS' });
    }

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Current location is required for SOS' });
    }

    if (!isValidCoordinate(latitude, longitude)) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates' });
    }

    await Location.findOneAndUpdate(
      { userId },
      { familyId, latitude, longitude, updatedAt: Date.now() },
      { upsert: true },
    );

    recordHistoryPoint({ userId, familyId, latitude: Number(latitude), longitude: Number(longitude) }).catch(() => {});

    await notifyFamilyMembers({
      familyId,
      excludeUserId: userId,
      type: 'sos_alert',
      title: `SOS from ${fullName}`,
      body: message || 'Emergency alert — tap to view location',
      data: { userId: String(userId), latitude: String(latitude), longitude: String(longitude), sos: 'true' },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`family_${familyId}`).emit('sos_alert', {
        userId,
        fullName,
        latitude,
        longitude,
        message: message || null,
        createdAt: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'SOS alert sent to family',
      data: { latitude, longitude, sentAt: new Date().toISOString() },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  updateLocation,
  getFamilyLocations,
  getUserLocation,
  getLocationHistory,
  setSharing,
  sendSOS,
};
