const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createPoll, getPoll, getPollByEvent, castVote, closePoll } = require('../controllers/pollController');
const { protect, requireFamily } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(protect, requireFamily);

router.post(
  '/',
  [
    body('eventId').isMongoId().withMessage('Valid event ID is required'),
    body('question').trim().notEmpty().withMessage('Poll question is required'),
    body('options').isArray({ min: 2 }).withMessage('At least 2 options are required'),
  ],
  validate,
  createPoll
);

router.get('/event/:eventId', getPollByEvent);

router.get('/:pollId', getPoll);

router.post(
  '/:pollId/vote',
  [
    body('optionId').isMongoId().withMessage('Valid option ID is required'),
    body('vote').isIn(['yes', 'maybe', 'no']).withMessage('Vote must be yes, maybe, or no'),
  ],
  validate,
  castVote
);

router.post('/:pollId/close', closePoll);

module.exports = router;
