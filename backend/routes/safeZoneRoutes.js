const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const {
  getSafeZones,
  createSafeZone,
  updateSafeZone,
  deleteSafeZone,
} = require('../controllers/safeZoneController');

// All safe-zone routes require authentication
router.use(protect);

// Reject malformed ids with 400 before controllers run
const { objectIdParam } = require('../middleware/validateObjectId');
router.param('id', objectIdParam);

router.get('/', getSafeZones);
router.post('/', createSafeZone);
router.put('/:id', updateSafeZone);
router.delete('/:id', deleteSafeZone);

module.exports = router;
