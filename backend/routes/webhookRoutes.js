const express = require('express');
const router = express.Router();
const { notifyFamilyMembers } = require('../services/notificationService');

// POST /api/webhooks/geofence
// Simulates a geofence crossing event
router.post('/geofence', async (req, res) => {
  try {
    const { userId, familyId, action, locationName } = req.body;
    
    if (!userId || !familyId || !action) {
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
