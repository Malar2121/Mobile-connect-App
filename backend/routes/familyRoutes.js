const express = require('express');
const router = express.Router();
const {
  createFamily,
  getMyFamily,
  joinFamilyByCode,
  inviteMember,
  leaveFamily,
} = require('../controllers/familyController');
const { protect } = require('../middleware/authMiddleware');

// All family routes require a valid JWT
router.use(protect);

// ──────────────────────────────────────────────────────────
// POST /api/family/create
// Create a new family (logged-in user becomes admin)
// ──────────────────────────────────────────────────────────
router.post('/create', createFamily);

// ──────────────────────────────────────────────────────────
// GET /api/family/my-family
// Get the current user's family + populated members
// ──────────────────────────────────────────────────────────
router.get('/my-family', getMyFamily);

// ──────────────────────────────────────────────────────────
// POST /api/family/join
// Join a family using an invite code
// Body: { inviteCode: "ABCD-EFGH" }
// ──────────────────────────────────────────────────────────
router.post('/join', joinFamilyByCode);

// ──────────────────────────────────────────────────────────
// POST /api/family/invite
// Get (or regenerate) the family invite code + shareable link
// Body (optional): { regenerate: true }  — admin only
// ──────────────────────────────────────────────────────────
router.post('/invite', inviteMember);

// ──────────────────────────────────────────────────────────
// DELETE /api/family/leave
// Leave your current family (non-admins only)
// ──────────────────────────────────────────────────────────
router.delete('/leave', leaveFamily);

module.exports = router;
