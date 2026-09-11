const express = require('express');
const router = express.Router();

const {
  getLegacyProfiles,
  getLegacyProfile,
  createLegacyProfile,
  updateLegacyProfile,
  deleteLegacyProfile,
  addTribute,
} = require('../controllers/legacyController');

const { protect } = require('../middleware/authMiddleware');

const { requireParentalConsent } = require('../middleware/requireParentalConsent');
const { denyGuestWrites } = require('../middleware/denyGuestWrites');

// Legacy profiles and tributes are family content, so the same consent gate
// and guest read-only rule as memories apply.
router.use(protect, requireParentalConsent, denyGuestWrites);

// Reject malformed ids with 400 before controllers run (BUG-L1 fix)
const { objectIdParam } = require('../middleware/validateObjectId');
router.param('id', objectIdParam);

router.get('/', getLegacyProfiles);
router.post('/', createLegacyProfile);
router.get('/:id', getLegacyProfile);
router.put('/:id', updateLegacyProfile);
router.delete('/:id', deleteLegacyProfile);
router.post('/:id/tributes', addTribute);

module.exports = router;
