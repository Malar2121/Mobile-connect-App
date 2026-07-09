const express = require('express');
const router = express.Router();

const {
  createEvent,
  getFamilyEvents,
  getEventDetails,
  respondToEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');

const { protect } = require('../middleware/authMiddleware');

// All event routes require authentication
router.use(protect);

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
