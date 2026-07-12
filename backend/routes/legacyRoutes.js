const express = require('express');
const router = express.Router();

const {
  getLegacyProfiles,
  getLegacyProfile,
  createLegacyProfile,
  addTribute,
} = require('../controllers/legacyController');

const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getLegacyProfiles);
router.post('/', createLegacyProfile);
router.get('/:id', getLegacyProfile);
router.post('/:id/tributes', addTribute);

module.exports = router;
