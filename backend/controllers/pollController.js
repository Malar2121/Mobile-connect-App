const EventPoll = require('../models/EventPoll');
const Event = require('../models/Event');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// ──────────────────────────────────────────
//  POST /api/polls
// ──────────────────────────────────────────
const createPoll = asyncHandler(async (req, res) => {
  const { eventId, question, options, deadline } = req.body;

  const event = await Event.findOne({ _id: eventId, familyId: req.user.familyId });
  if (!event) return errorResponse(res, 'Event not found', 404);

  const poll = await EventPoll.create({
    event: eventId,
    family: req.user.familyId,
    createdBy: req.user._id,
    question,
    options: options.map((o) => ({ dateTime: new Date(o.dateTime), label: o.label })),
    deadline: deadline ? new Date(deadline) : undefined,
  });

  // Link poll to event
  event.poll = poll._id;
  await event.save();

  return successResponse(res, { poll }, 'Poll created', 201);
});

// ──────────────────────────────────────────
//  GET /api/polls/event/:eventId
// ──────────────────────────────────────────
const getPollByEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ _id: req.params.eventId, familyId: req.user.familyId });
  if (!event) return errorResponse(res, 'Event not found', 404);

  const poll = await EventPoll.findOne({ event: event._id, family: req.user.familyId })
    .populate('createdBy', 'fullName avatar')
    .populate('options.votes.user', 'fullName avatar');

  if (!poll) return errorResponse(res, 'No poll for this event', 404);

  const results = computePollResults(poll);
  return successResponse(res, { poll, results }, 'Poll retrieved');
});

// ──────────────────────────────────────────
const getPoll = asyncHandler(async (req, res) => {
  const poll = await EventPoll.findOne({ _id: req.params.pollId, family: req.user.familyId })
    .populate('createdBy', 'fullName avatar')
    .populate('options.votes.user', 'fullName avatar');

  if (!poll) return errorResponse(res, 'Poll not found', 404);

  const results = computePollResults(poll);
  return successResponse(res, { poll, results }, 'Poll retrieved');
});

// ──────────────────────────────────────────
//  POST /api/polls/:pollId/vote
// ──────────────────────────────────────────
const castVote = asyncHandler(async (req, res) => {
  const { optionId, vote } = req.body;
  const validVotes = ['yes', 'maybe', 'no'];

  if (!validVotes.includes(vote)) {
    return errorResponse(res, `Vote must be one of: ${validVotes.join(', ')}`, 400);
  }

  const poll = await EventPoll.findOne({ _id: req.params.pollId, family: req.user.familyId });
  if (!poll) return errorResponse(res, 'Poll not found', 404);

  if (poll.isClosed) return errorResponse(res, 'This poll is closed', 400);
  if (poll.deadline && new Date(poll.deadline) < new Date()) {
    poll.isClosed = true;
    await poll.save();
    return errorResponse(res, 'Poll deadline has passed', 400);
  }

  const option = poll.options.id(optionId);
  if (!option) return errorResponse(res, 'Poll option not found', 404);

  // Remove existing vote from this user on this option
  option.votes = option.votes.filter((v) => String(v.user) !== String(req.user._id));
  option.votes.push({ user: req.user._id, vote });

  await poll.save();

  const results = computePollResults(poll);
  return successResponse(res, { results }, 'Vote recorded');
});

// ──────────────────────────────────────────
//  POST /api/polls/:pollId/close
// ──────────────────────────────────────────
const closePoll = asyncHandler(async (req, res) => {
  const { selectedOptionId } = req.body;

  const poll = await EventPoll.findOne({ _id: req.params.pollId, family: req.user.familyId });
  if (!poll) return errorResponse(res, 'Poll not found', 404);

  if (String(poll.createdBy) !== String(req.user._id) && req.user.role !== 'admin') {
    return errorResponse(res, 'Not authorized to close this poll', 403);
  }

  poll.isClosed = true;
  if (selectedOptionId) poll.selectedOption = selectedOptionId;
  await poll.save();

  return successResponse(res, { poll }, 'Poll closed');
});

// ──────────────────────────────────────────
//  Helper: Compute poll availability results
// ──────────────────────────────────────────
const computePollResults = (poll) => {
  return poll.options.map((option) => {
    const yesCount = option.votes.filter((v) => v.vote === 'yes').length;
    const maybeCount = option.votes.filter((v) => v.vote === 'maybe').length;
    const noCount = option.votes.filter((v) => v.vote === 'no').length;
    const totalVotes = option.votes.length;
    const availabilityScore = totalVotes > 0 ? ((yesCount + maybeCount * 0.5) / totalVotes) * 100 : 0;

    return {
      optionId: option._id,
      dateTime: option.dateTime,
      label: option.label,
      votes: { yes: yesCount, maybe: maybeCount, no: noCount, total: totalVotes },
      availabilityScore: Math.round(availabilityScore),
    };
  });
};

module.exports = { createPoll, getPoll, getPollByEvent, castVote, closePoll };
