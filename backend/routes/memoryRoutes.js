const express = require('express');
const { requireParentalConsent } = require('../middleware/requireParentalConsent');
const { denyGuestWrites } = require('../middleware/denyGuestWrites');
const { enforceMediaQuota } = require('../middleware/mediaQuota');
const router = express.Router();

const {
  uploadMemory,
  getFamilyMemories,
  getPendingMemories,
  getMediaUsage,
  getMemoryDetails,
  approveMemory,
  rejectMemory,
  likeMemory,
  deleteMemory,
  getComments,
  addComment,
} = require('../controllers/memoryController');

const { protect } = require('../middleware/authMiddleware');

// Import the memoryUpload cloudinary helper configuration
const { memoryUpload } = require('../config/cloudinary');

// All memories routes require authentication
router.use(protect, requireParentalConsent, denyGuestWrites);

// Reject malformed ids with 400 before controllers run (BUG-L1 fix)
const { objectIdParam } = require('../middleware/validateObjectId');
router.param('id', objectIdParam);

// ──────────────────────────────────────────────────────────
// POST /api/memories/upload
// Upload image or video to Cloudinary (form-data field 'media').
// The quota check runs first so a refused file never reaches Cloudinary.
// ──────────────────────────────────────────────────────────
router.post('/upload', enforceMediaQuota, memoryUpload.single('media'), uploadMemory);

// ──────────────────────────────────────────────────────────
// GET /api/memories
// Approved family memories plus the caller's own uploads
// ──────────────────────────────────────────────────────────
router.get('/', getFamilyMemories);

// ──────────────────────────────────────────────────────────
// GET /api/memories/pending — review queue (adult members)
// GET /api/memories/usage   — family storage used / quota
// Declared before '/:id' so they are not read as ids.
// ──────────────────────────────────────────────────────────
router.get('/pending', getPendingMemories);
router.get('/usage', getMediaUsage);

// ──────────────────────────────────────────────────────────
// POST /api/memories/like
// Toggle like
// ──────────────────────────────────────────────────────────
router.post('/like', likeMemory);

// ──────────────────────────────────────────────────────────
// POST /api/memories/:id/approve · POST /api/memories/:id/reject
// Proposal §8 — members approve shared photos and videos
// ──────────────────────────────────────────────────────────
router.post('/:id/approve', approveMemory);
router.post('/:id/reject', rejectMemory);

// ──────────────────────────────────────────────────────────
// GET /api/memories/:id/comments
// Get comments for a memory
// ──────────────────────────────────────────────────────────
router.get('/:id/comments', getComments);

// ──────────────────────────────────────────────────────────
// POST /api/memories/:id/comments
// Add a comment to a memory
// ──────────────────────────────────────────────────────────
router.post('/:id/comments', addComment);

// ──────────────────────────────────────────────────────────
// GET /api/memories/:id
// Return memory + tags + uploader info
// ──────────────────────────────────────────────────────────
router.get('/:id', getMemoryDetails);

// ──────────────────────────────────────────────────────────
// DELETE /api/memories/:id
// Delete memory (only uploader or admin)
// ──────────────────────────────────────────────────────────
router.delete('/:id', deleteMemory);

module.exports = router;
