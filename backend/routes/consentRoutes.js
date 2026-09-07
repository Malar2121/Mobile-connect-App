const express = require('express');
const router = express.Router();

const {
  getMyConsent,
  getPendingConsents,
  approveConsent,
  rejectConsent,
} = require('../controllers/consentController');

const { protect } = require('../middleware/authMiddleware');
const { objectIdParam } = require('../middleware/validateObjectId');

router.use(protect);
router.param('id', objectIdParam);

// A child may always read its own status — this route is deliberately NOT
// behind requireParentalConsent, otherwise a pending child could never find
// out why they are blocked.
router.get('/me', getMyConsent);

// Guardian review queue and decisions.
router.get('/pending', getPendingConsents);
router.post('/:id/approve', approveConsent);
router.post('/:id/reject', rejectConsent);

module.exports = router;
