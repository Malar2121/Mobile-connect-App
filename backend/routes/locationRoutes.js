const express = require('express');
const { requireParentalConsent } = require('../middleware/requireParentalConsent');
const { denyGuestWrites } = require('../middleware/denyGuestWrites');
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

// ── SOS is intentionally BEFORE the consent gate ──────────
// A child whose account is still pending guardian approval must be able
// to send an emergency alert. Blocking SOS behind consent would leave
// a minor unable to call for help — that is a safety defect.
router.post('/sos', sendSOS);

// All other routes also require parental consent (child accounts must
// be approved before accessing family location data) and deny guest writes.
router.use(requireParentalConsent, denyGuestWrites);

// Reject malformed ids with 400 before controllers run (BUG-L1 fix)
const { objectIdParam } = require('../middleware/validateObjectId');
router.param('userId', objectIdParam);

// ──────────────────────────────────────────────────────────
// POST /api/location/update
// Update the user's location and broadcast live to family
// ──────────────────────────────────────────────────────────
router.post('/update', updateLocation);
router.post('/sharing', setSharing);
router.get('/family', getFamilyLocations);
router.get('/history/:userId', getLocationHistory);


// ──────────────────────────────────────────────────────────
// GET /api/location/:userId
// Load the location of a specific family member securely
// ──────────────────────────────────────────────────────────
router.get('/:userId', getUserLocation);

module.exports = router;
