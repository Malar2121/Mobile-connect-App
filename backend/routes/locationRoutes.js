const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { updateLocation, getFamilyLocations, getUserLocation, sendSOS } = require('../controllers/locationController');

// All location routes require authentication
router.use(protect);

// ──────────────────────────────────────────────────────────
// POST /api/location/update
// Update the user's location and broadcast live to family
// ──────────────────────────────────────────────────────────
router.post('/update', updateLocation);
router.post('/sos', sendSOS);
router.get('/family', getFamilyLocations);

// ──────────────────────────────────────────────────────────
// GET /api/location/:userId
// Load the location of a specific family member securely
// ──────────────────────────────────────────────────────────
router.get('/:userId', getUserLocation);

module.exports = router;
