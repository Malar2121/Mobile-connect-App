const express = require('express');
const router = express.Router();

const {
  uploadMemory,
  getFamilyMemories,
  getMemoryDetails,
  likeMemory,
  deleteMemory,
  getComments,
  addComment,
} = require('../controllers/memoryController');

const { protect } = require('../middleware/authMiddleware');

// Import the memoryUpload cloudinary helper configuration
const { memoryUpload } = require('../config/cloudinary');

// All memories routes require authentication
router.use(protect);

// Reject malformed ids with 400 before controllers run (BUG-L1 fix)
const { objectIdParam } = require('../middleware/validateObjectId');
router.param('id', objectIdParam);

// ──────────────────────────────────────────────────────────
// POST /api/memories/upload
// Upload image or video to Cloudinary
// (expects form-data with field name 'media')
// ──────────────────────────────────────────────────────────
router.post('/upload', memoryUpload.single('media'), uploadMemory);

// ──────────────────────────────────────────────────────────
// GET /api/memories
// Fetch memories for a family
// ──────────────────────────────────────────────────────────
router.get('/', getFamilyMemories);

// ──────────────────────────────────────────────────────────
// POST /api/memories/like
// Toggle like
// ──────────────────────────────────────────────────────────
router.post('/like', likeMemory);

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
