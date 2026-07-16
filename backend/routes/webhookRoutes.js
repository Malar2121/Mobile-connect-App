const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { notifyFamilyMembers } = require('../services/notificationService');

// POST /api/webhooks/geofence
// Simulates a geofence crossing event (demo tooling).
// Authenticated and family-scoped so it cannot be used to spam
// arbitrary families with push notifications.
router.post('/geofence', protect, async (req, res) => {
  try {
    const { userId, action, locationName } = req.body;
    const familyId = req.user.familyId;

    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family' });
    }
    if (!userId || !action) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    let title = 'Geofence Alert';
    let body = `A family member just ${action === 'enter' ? 'arrived at' : 'left'} ${locationName || 'a location'}.`;

    notifyFamilyMembers({
      familyId,
      excludeUserId: userId,
      type: 'geofence_alert',
      title,
      body,
      data: { action, locationName, userId },
    });

    return res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
