const mongoose = require('mongoose');
const Story = require('../models/Story');
const Event = require('../models/Event');
const { notifyFamilyMembers } = require('../services/notificationService');

const { STORY_CATEGORIES } = Story;
const TITLE_MAX = 120;
const BODY_MAX = 5000;
const POPULATE_AUTHOR = { path: 'author', select: 'fullName avatar' };
const POPULATE_EVENT = { path: 'event', select: 'title date' };

const notFound = (res) => res.status(404).json({ success: false, message: 'Story not found' });
const badRequest = (res, message) => res.status(400).json({ success: false, message });

/**
 * Validate the editable fields of a story. With `partial`, absent fields are
 * left alone (update); otherwise title and body are required (create).
 * Returns { error } or { values }.
 */
async function readStoryInput(body, familyId, { partial }) {
  const values = {};

  if (!partial || body.title !== undefined) {
    const title = String(body.title ?? '').trim();
    if (!title) return { error: 'A story needs a title' };
    if (title.length > TITLE_MAX) return { error: `The title can be at most ${TITLE_MAX} characters` };
    values.title = title;
  }

  if (!partial || body.body !== undefined) {
    const text = String(body.body ?? '').trim();
    if (!text) return { error: 'A story needs some text' };
    if (text.length > BODY_MAX) return { error: `A story can be at most ${BODY_MAX} characters` };
    values.body = text;
  }

  if (body.category !== undefined) {
    if (!STORY_CATEGORIES.includes(body.category)) return { error: 'Unknown story category' };
    values.category = body.category;
  }

  if (body.happenedOn !== undefined) {
    if (body.happenedOn === null || body.happenedOn === '') {
      values.happenedOn = null;
    } else {
      const date = new Date(body.happenedOn);
      if (Number.isNaN(date.getTime())) return { error: 'happenedOn must be a valid date' };
      values.happenedOn = date;
    }
  }

  if (body.event !== undefined) {
    if (body.event === null || body.event === '') {
      values.event = null;
    } else {
      // A story may only point at an event in the author's own family.
      const event = mongoose.isValidObjectId(body.event)
        ? await Event.findOne({ _id: body.event, familyId }).select('_id')
        : null;
      if (!event) return { error: 'EVENT_NOT_FOUND' };
      values.event = event._id;
    }
  }

  return { values };
}

function inputError(res, error) {
  if (error === 'EVENT_NOT_FOUND') {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }
  return badRequest(res, error);
}

const canEdit = (user, story) => user.role === 'admin' || String(story.author?._id ?? story.author) === String(user._id);

// GET /api/stories
const listStories = async (req, res) => {
  try {
    const { familyId } = req.user;
    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family to read stories' });
    }

    const filter = { familyId };
    if (req.query.category && STORY_CATEGORIES.includes(req.query.category)) {
      filter.category = req.query.category;
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const [stories, total] = await Promise.all([
      Story.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(POPULATE_AUTHOR)
        .populate(POPULATE_EVENT),
      Story.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: stories,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/stories/:id
const getStory = async (req, res) => {
  try {
    const story = await Story.findOne({ _id: req.params.id, familyId: req.user.familyId })
      .populate(POPULATE_AUTHOR)
      .populate(POPULATE_EVENT);
    if (!story) return notFound(res);
    return res.status(200).json({ success: true, data: story });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/stories
const createStory = async (req, res) => {
  try {
    const { familyId, _id: userId, fullName } = req.user;
    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family to share a story' });
    }

    const { error, values } = await readStoryInput(req.body ?? {}, familyId, { partial: false });
    if (error) return inputError(res, error);

    const story = await Story.create({ ...values, familyId, author: userId });
    await story.populate([POPULATE_AUTHOR, POPULATE_EVENT]);

    notifyFamilyMembers({
      familyId,
      excludeUserId: userId,
      type: 'story_created',
      title: `${fullName} shared a family story`,
      body: story.title,
      data: { storyId: String(story._id) },
    });

    return res.status(201).json({ success: true, message: 'Story shared', data: story });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/stories/:id — the author or an admin
const updateStory = async (req, res) => {
  try {
    const { familyId } = req.user;
    const story = await Story.findOne({ _id: req.params.id, familyId });
    if (!story) return notFound(res);
    if (!canEdit(req.user, story)) {
      return res.status(403).json({ success: false, message: 'Only the author or an admin can edit this story' });
    }

    const { error, values } = await readStoryInput(req.body ?? {}, familyId, { partial: true });
    if (error) return inputError(res, error);

    Object.assign(story, values);
    await story.save();
    await story.populate([POPULATE_AUTHOR, POPULATE_EVENT]);

    return res.status(200).json({ success: true, message: 'Story updated', data: story });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/stories/:id — the author or an admin
const deleteStory = async (req, res) => {
  try {
    const story = await Story.findOne({ _id: req.params.id, familyId: req.user.familyId });
    if (!story) return notFound(res);
    if (!canEdit(req.user, story)) {
      return res.status(403).json({ success: false, message: 'Only the author or an admin can delete this story' });
    }

    await story.deleteOne();
    return res.status(200).json({ success: true, message: 'Story deleted', data: {} });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { listStories, getStory, createStory, updateStory, deleteStory };
