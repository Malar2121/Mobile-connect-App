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

// Reject malformed ids with 400 before controllers run (BUG-L1 fix)
const { objectIdParam } = require('../middleware/validateObjectId');
router.param('id', objectIdParam);

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

// Shared family history journal. Family content, so consent-gated and
// read-only for guests.
const { getFamilyHistory, updateFamilyHistory } = require('../controllers/familyHistoryController');
const { requireParentalConsent } = require('../middleware/requireParentalConsent');
const { denyGuestWrites } = require('../middleware/denyGuestWrites');

router.get('/history', requireParentalConsent, getFamilyHistory);
router.put('/history', requireParentalConsent, denyGuestWrites, updateFamilyHistory);

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

const {
  updateFamily,
  updateMemberRole,
  updateMemberType,
  createJoinRequest,
  getJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  addLifeEvent
} = require('../controllers/familyController');

router.patch('/', updateFamily);
router.put('/members/:id/role', updateMemberRole);
router.put('/members/:id/type', updateMemberType);
router.post('/members/:id/life-events', addLifeEvent);

router.post('/join-requests', createJoinRequest);
router.get('/join-requests', getJoinRequests);
router.post('/join-requests/:id/approve', approveJoinRequest);
router.post('/join-requests/:id/reject', rejectJoinRequest);

// ──────────────────────────────────────────────────────────
// Email invitations (§6.3 — secure onboarding via email or QR)
// ──────────────────────────────────────────────────────────
const {
  createInvitation,
  listInvitations,
  revokeInvitation,
  verifyInvitation,
  acceptInvitation,
} = require('../controllers/invitationController');

router.post('/invitations', createInvitation);
router.get('/invitations', listInvitations);
router.get('/invitations/verify/:token', verifyInvitation);
router.post('/invitations/accept', acceptInvitation);
router.delete('/invitations/:id', revokeInvitation);

module.exports = router;
