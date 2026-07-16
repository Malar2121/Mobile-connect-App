const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getMe,
  updateMe,
  loginWith2FA,
  setup2FA,
  verify2FA,
  disable2FA,
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

// POST /api/auth/2fa/login — complete a two-factor login
router.post('/2fa/login', loginWith2FA);

// ──────────────────────────────────────────────────────────
// Protected routes (valid JWT required)
// ──────────────────────────────────────────────────────────

// POST /api/auth/logout
router.post('/logout', protect, logoutUser);

// GET /api/auth/me
router.get('/me', protect, getMe);

// PATCH /api/auth/me
router.patch('/me', protect, updateMe);

// Two-factor authentication management
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/2fa/disable', protect, disable2FA);

module.exports = router;
