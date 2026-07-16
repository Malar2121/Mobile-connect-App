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

router.use(protect);

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
