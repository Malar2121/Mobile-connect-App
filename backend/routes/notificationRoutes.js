const express = require('express');
const router = express.Router();

const {
  createNotification,
  getNotifications,
  markAsRead,
  deleteNotification,
} = require('../controllers/notificationController');

const { protect } = require('../middleware/authMiddleware');

// All notification routes require authentication
router.use(protect);

// ──────────────────────────────────────────────────────────
// GET /api/notifications
// Get all notifications for the logged in user
// ──────────────────────────────────────────────────────────
router.get('/', getNotifications);

// ──────────────────────────────────────────────────────────
// POST /api/notifications/create
// Trigger a manual Push + In App notification
// ──────────────────────────────────────────────────────────
router.post('/create', createNotification);

// ──────────────────────────────────────────────────────────
// PUT /api/notifications/read/:id
// Mark a notification as read
// ──────────────────────────────────────────────────────────
router.put('/read/:id', markAsRead);

// ──────────────────────────────────────────────────────────
// DELETE /api/notifications/:id
// Delete a specific notification
// ──────────────────────────────────────────────────────────
router.delete('/:id', deleteNotification);

module.exports = router;
