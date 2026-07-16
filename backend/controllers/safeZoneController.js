const SafeZone = require('../models/SafeZone');
const Location = require('../models/Location');
const { isValidCoordinate } = require('../utils/geo');

const canManageZones = (user) => user.role === 'admin' || user.role === 'parent';

// ══════════════════════════════════════════════════════════
// GET /api/safezones
// ══════════════════════════════════════════════════════════
const getSafeZones = async (req, res) => {
  try {
    const { familyId } = req.user;
    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family' });
    }

    const zones = await SafeZone.find({ familyId, isActive: true })
      .populate('createdBy', 'fullName avatar')
      .populate('appliesTo', 'fullName avatar memberType')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, message: 'Safe zones retrieved', data: zones });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// POST /api/safezones  (admin or parent)
// ══════════════════════════════════════════════════════════
const createSafeZone = async (req, res) => {
  try {
    const { familyId, _id: userId } = req.user;
    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family' });
    }
    if (!canManageZones(req.user)) {
      return res.status(403).json({ success: false, message: 'Only admins and parents can manage safe zones' });
    }

    const { name, latitude, longitude, radius, type, notifyOnEnter, notifyOnExit, appliesTo } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Zone name is required' });
    }
    if (!isValidCoordinate(latitude, longitude)) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates' });
    }
    if (!Number.isFinite(Number(radius))) {
      return res.status(400).json({ success: false, message: 'Radius is required (meters)' });
    }

    const zone = await SafeZone.create({
      familyId,
      name: name.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      radius: Number(radius),
      type,
      notifyOnEnter: notifyOnEnter !== false,
      notifyOnExit: notifyOnExit !== false,
      appliesTo: Array.isArray(appliesTo) ? appliesTo : [],
      createdBy: userId,
    });

    const io = req.app.get('io');
    if (io) io.to(`family_${familyId}`).emit('safezones_changed', { action: 'created', zoneId: zone._id });

    return res.status(201).json({ success: true, message: 'Safe zone created', data: zone });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(422).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// PUT /api/safezones/:id  (admin or parent)
// ══════════════════════════════════════════════════════════
const updateSafeZone = async (req, res) => {
  try {
    const { familyId } = req.user;
    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family' });
    }
    if (!canManageZones(req.user)) {
      return res.status(403).json({ success: false, message: 'Only admins and parents can manage safe zones' });
    }

    const allowed = ['name', 'latitude', 'longitude', 'radius', 'type', 'notifyOnEnter', 'notifyOnExit', 'appliesTo', 'isActive'];
    const updateData = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    });

    if (
      (updateData.latitude !== undefined || updateData.longitude !== undefined) &&
      !isValidCoordinate(updateData.latitude, updateData.longitude)
    ) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates' });
    }

    const zone = await SafeZone.findOneAndUpdate({ _id: req.params.id, familyId }, updateData, {
      new: true,
      runValidators: true,
    });

    if (!zone) {
      return res.status(404).json({ success: false, message: 'Safe zone not found' });
    }

    const io = req.app.get('io');
    if (io) io.to(`family_${familyId}`).emit('safezones_changed', { action: 'updated', zoneId: zone._id });

    return res.status(200).json({ success: true, message: 'Safe zone updated', data: zone });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid zone id' });
    }
    if (error.name === 'ValidationError') {
      return res.status(422).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// DELETE /api/safezones/:id  (admin or parent)
// ══════════════════════════════════════════════════════════
const deleteSafeZone = async (req, res) => {
  try {
    const { familyId } = req.user;
    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family' });
    }
    if (!canManageZones(req.user)) {
      return res.status(403).json({ success: false, message: 'Only admins and parents can manage safe zones' });
    }

    const zone = await SafeZone.findOneAndDelete({ _id: req.params.id, familyId });
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Safe zone not found' });
    }

    // Remove the deleted zone from anyone currently "inside" it
    await Location.updateMany({ familyId }, { $pull: { currentZoneIds: zone._id } });

    const io = req.app.get('io');
    if (io) io.to(`family_${familyId}`).emit('safezones_changed', { action: 'deleted', zoneId: zone._id });

    return res.status(200).json({ success: true, message: 'Safe zone deleted', data: {} });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid zone id' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSafeZones, createSafeZone, updateSafeZone, deleteSafeZone };
