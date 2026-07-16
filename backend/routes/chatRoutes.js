const express = require('express');
const router = express.Router();

const {
  sendMessage,
  getFamilyMessages,
  deleteMessage,
  editMessage,
  reactToMessage,
  pinMessage,
  unpinMessage,
  toggleStarMessage,
  searchMessages,
  getPinnedMessages,
  getStarredMessages,
} = require('../controllers/chatController');

const { protect } = require('../middleware/authMiddleware');
const { chatUpload } = require('../config/cloudinary');

router.use(protect);

// Reject malformed ids with 400 before controllers run (BUG-L1 fix)
const { objectIdParam } = require('../middleware/validateObjectId');
router.param('id', objectIdParam);

router.post('/send', chatUpload.single('media'), sendMessage);
router.get('/messages', getFamilyMessages);
router.get('/search', searchMessages);
router.get('/pinned', getPinnedMessages);
router.get('/starred', getStarredMessages);
router.delete('/:id', deleteMessage);
router.patch('/:id', editMessage);
router.post('/:id/react', reactToMessage);
router.post('/:id/pin', pinMessage);
router.delete('/:id/pin', unpinMessage);
router.post('/:id/star', toggleStarMessage);

module.exports = router;
