const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getMe,
  updateMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// ──────────────────────────────────────────────────────────
// Public routes (no token required)
// ──────────────────────────────────────────────────────────

// POST /api/auth/register
router.post('/register', registerUser);

// POST /api/auth/login
router.post('/login', loginUser);

// POST /api/auth/refresh
router.post('/refresh', refreshToken);

// ──────────────────────────────────────────────────────────
// Protected routes (valid JWT required)
// ──────────────────────────────────────────────────────────

// POST /api/auth/logout
router.post('/logout', protect, logoutUser);

// GET /api/auth/me
router.get('/me', protect, getMe);

// PATCH /api/auth/me
router.patch('/me', protect, updateMe);

module.exports = router;
