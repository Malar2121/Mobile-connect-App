const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getFamilyTree, updateRelationship } = require('../controllers/familyTreeController');
const { protect, requireFamily } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { requireParentalConsent } = require('../middleware/requireParentalConsent');
const { denyGuestWrites } = require('../middleware/denyGuestWrites');

router.use(protect, requireFamily, requireParentalConsent, denyGuestWrites);

router.get('/', getFamilyTree);

router.put(
  '/relationship',
  [
    body('userId').isMongoId().withMessage('Valid user ID is required'),
    body('relationshipType')
      .optional()
      .isIn(['parent', 'child', 'grandparent', 'grandchild', 'sibling', 'spouse', 'uncle', 'aunt', 'cousin', 'nephew', 'niece', 'other'])
      .withMessage('Invalid relationship type'),
  ],
  validate,
  updateRelationship
);

module.exports = router;
