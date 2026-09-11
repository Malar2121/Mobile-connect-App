const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { requireParentalConsent } = require('../middleware/requireParentalConsent');
const { denyGuestWrites } = require('../middleware/denyGuestWrites');
const { objectIdParam } = require('../middleware/validateObjectId');
const {
  listStories,
  getStory,
  createStory,
  updateStory,
  deleteStory,
} = require('../controllers/storyController');

const router = express.Router();

// Family stories are family content: authenticated, consent-gated, and
// read-only for guests — the same rules as memories.
router.use(protect, requireParentalConsent, denyGuestWrites);
router.param('id', objectIdParam);

router.get('/', listStories);
router.post('/', createStory);
router.get('/:id', getStory);
router.put('/:id', updateStory);
router.delete('/:id', deleteStory);

module.exports = router;
