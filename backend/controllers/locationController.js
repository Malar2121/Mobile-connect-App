const Location = require('../models/Location');
const { notifyFamilyMembers } = require('../services/notificationService');

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

    const payload = {
      familyId,
      latitude,
      longitude,
      updatedAt: Date.now(),
    };
    if (accuracy != null) payload.accuracy = Number(accuracy);
    if (heading != null) payload.heading = Number(heading);
    if (speed != null) payload.speed = Number(speed);
    if (battery != null) payload.battery = Number(battery);

    const location = await Location.findOneAndUpdate({ userId }, payload, { new: true, upsert: true }).populate(
      'userId',
      'fullName avatar',
    );

    const io = req.app.get('io');
    if (io) {
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

const getFamilyLocations = async (req, res) => {
  try {
    const { familyId } = req.user;

    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family to view locations' });
    }

    const locations = await Location.find({ familyId })
      .populate('userId', 'fullName email avatar')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Family locations retrieved',
      data: locations,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getUserLocation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { familyId } = req.user;

    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family' });
    }

    const location = await Location.findOne({ userId, familyId }).populate('userId', 'fullName avatar');

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location unavailable or user not in family' });
    }

    return res.status(200).json({
      success: true,
      message: 'User location retrieved',
      data: location,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

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

    await Location.findOneAndUpdate(
      { userId },
      { familyId, latitude, longitude, updatedAt: Date.now() },
      { upsert: true },
    );

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
  sendSOS,
};
