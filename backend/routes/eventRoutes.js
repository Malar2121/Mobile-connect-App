const express = require('express');
const router = express.Router();

const {
  createEvent,
  getFamilyEvents,
  getEventDetails,
  respondToEvent,
  updateEvent,
  deleteEvent,
  getComments,
  addComment,
} = require('../controllers/eventController');

const { protect } = require('../middleware/authMiddleware');
const { objectIdParam } = require('../middleware/validateObjectId');

// All event routes require authentication
router.use(protect);

// Reject malformed ids with 400 before controllers run (BUG-L1 fix)
router.param('id', objectIdParam);

// ──────────────────────────────────────────────────────────
// POST /api/events/create
// Create event for family
// ──────────────────────────────────────────────────────────
router.post('/create', createEvent);

// ──────────────────────────────────────────────────────────
// GET /api/events
// Get all events for a family
// ──────────────────────────────────────────────────────────
router.get('/', getFamilyEvents);

// ──────────────────────────────────────────────────────────
// POST /api/events/respond
// Accept or decline invitation
// ──────────────────────────────────────────────────────────
router.post('/respond', respondToEvent);

// ──────────────────────────────────────────────────────────
// GET /api/events/:id/comments
// Get comments for an event
// ──────────────────────────────────────────────────────────
router.get('/:id/comments', getComments);

// ──────────────────────────────────────────────────────────
// POST /api/events/:id/comments
// Add a comment to an event
// ──────────────────────────────────────────────────────────
router.post('/:id/comments', addComment);

// ──────────────────────────────────────────────────────────
// GET /api/events/:id
// Get event details + guests
// ──────────────────────────────────────────────────────────
router.get('/:id', getEventDetails);

// ──────────────────────────────────────────────────────────
// PATCH /api/events/:id
// Update event (creator or admin)
// ──────────────────────────────────────────────────────────
router.patch('/:id', updateEvent);

// ──────────────────────────────────────────────────────────
// DELETE /api/events/:id
// Delete event (only admin or creator)
// ──────────────────────────────────────────────────────────
router.delete('/:id', deleteEvent);

module.exports = router;
