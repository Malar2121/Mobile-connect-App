const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const {
  updateLocation,
  getFamilyLocations,
  getUserLocation,
  getLocationHistory,
  setSharing,
  sendSOS,
} = require('../controllers/locationController');

// All location routes require authentication
router.use(protect);

// Reject malformed ids with 400 before controllers run (BUG-L1 fix)
const { objectIdParam } = require('../middleware/validateObjectId');
router.param('userId', objectIdParam);

// ──────────────────────────────────────────────────────────
// POST /api/location/update
// Update the user's location and broadcast live to family
// ──────────────────────────────────────────────────────────
router.post('/update', updateLocation);
router.post('/sos', sendSOS);
router.post('/sharing', setSharing);
router.get('/family', getFamilyLocations);
router.get('/history/:userId', getLocationHistory);

// ──────────────────────────────────────────────────────────
// GET /api/location/:userId
// Load the location of a specific family member securely
// ──────────────────────────────────────────────────────────
router.get('/:userId', getUserLocation);

module.exports = router;
