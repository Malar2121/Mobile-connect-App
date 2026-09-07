const express = require('express');
const router = express.Router();

const {
  getCelebrations,
  createCelebration,
  getCelebration,
  updateCelebration,
  deleteCelebration,
} = require('../controllers/celebrationController');

const { protect } = require('../middleware/authMiddleware');
const { objectIdParam } = require('../middleware/validateObjectId');

// Every celebration route requires a valid JWT; the controllers additionally
// scope every query by the caller's familyId.
router.use(protect);

// Reject malformed ids with 400 before the controllers run.
router.param('id', objectIdParam);

// GET  /api/celebrations?days=365  — upcoming, including derived birthdays
router.get('/', getCelebrations);

// POST /api/celebrations — anniversaries, cultural and other occasions
router.post('/', createCelebration);

router.get('/:id', getCelebration);
router.put('/:id', updateCelebration);
router.delete('/:id', deleteCelebration);

module.exports = router;
