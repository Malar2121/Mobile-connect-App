const Event = require('../models/Event');
const Family = require('../models/Family');
const Comment = require('../models/Comment');
const { notifyFamilyMembers } = require('../services/notificationService');

// ══════════════════════════════════════════════════════════
// POST /api/events/create
// Create event for family
// ══════════════════════════════════════════════════════════
const createEvent = async (req, res) => {
  try {
    const { title, description, date, startTime, endTime, location, image, recurrenceRule, reminders, attachments } = req.body;
    const { familyId, _id: userId, fullName } = req.user;

    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family to create an event' });
    }

    if (!title) {
      return res.status(400).json({ success: false, message: 'Event title is required' });
    }

    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({ success: false, message: 'Family not found' });
    }

    // Add all family members as guests with 'pending' status
    const guests = family.members.map((memberId) => ({
      userId: memberId,
      status: 'pending',
    }));

    const event = await Event.create({
      title,
      description,
      familyId,
      createdBy: userId,
      date,
      startTime,
      endTime,
      location,
      image,
      guests,
      recurrenceRule,
      reminders,
      attachments,
    });

    // Async notify all remaining family members!
    notifyFamilyMembers({
      familyId,
      excludeUserId: userId,
      type: 'event_created',
      title: 'New Family Event! 📅',
      body: `${fullName} created: ${title}`,
      data: { eventId: String(event._id) },
    });

    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// GET /api/events
// Get all events for a family
// ══════════════════════════════════════════════════════════
const getFamilyEvents = async (req, res) => {
  try {
    const { familyId } = req.user;

    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family to view events' });
    }

    const events = await Event.find({ familyId }).sort({ date: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Events retrieved successfully',
      data: events,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// GET /api/events/:id
// Get event details + guests
// ══════════════════════════════════════════════════════════
const getEventDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { familyId } = req.user;

    const event = await Event.findOne({ _id: id, familyId })
      .populate('createdBy', 'fullName email avatar')
      .populate('guests.userId', 'fullName email avatar');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Event details retrieved successfully',
      data: event,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// POST /api/events/respond
// Accept or decline invitation
// ══════════════════════════════════════════════════════════
const respondToEvent = async (req, res) => {
  try {
    const { eventId, status } = req.body;
    const { familyId, _id: userId } = req.user;

    if (!['accepted', 'declined', 'maybe'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const event = await Event.findOne({ _id: eventId, familyId });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const guestIdIndex = event.guests.findIndex((guest) => guest.userId.toString() === userId.toString());

    if (guestIdIndex === -1) {
      return res.status(403).json({ success: false, message: 'You are not invited to this event' });
    }

    event.guests[guestIdIndex].status = status;
    await event.save();

    return res.status(200).json({
      success: true,
      message: `Successfully responded to event setup to ${status}`,
      data: event,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// DELETE /api/events/:id
// Delete event (only admin or creator)
// ══════════════════════════════════════════════════════════
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { familyId, _id: userId, role } = req.user;

    const event = await Event.findOne({ _id: id, familyId });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.createdBy.toString() !== userId.toString() && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this event' });
    }

    await Event.deleteOne({ _id: id });
    await Comment.deleteMany({ onModel: 'Event', onDocument: id });

    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
      data: {},
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// PATCH /api/events/:id
// Update event (creator or admin)
// ══════════════════════════════════════════════════════════
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { familyId, _id: userId, role } = req.user;
    const { title, description, date, startTime, endTime, location, image, recurrenceRule, reminders, attachments } = req.body;

    const event = await Event.findOne({ _id: id, familyId });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.createdBy.toString() !== userId.toString() && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this event' });
    }

    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (date !== undefined) event.date = date;
    if (startTime !== undefined) event.startTime = startTime;
    if (endTime !== undefined) event.endTime = endTime;
    if (location !== undefined) event.location = location;
    if (image !== undefined) event.image = image;
    if (recurrenceRule !== undefined) event.recurrenceRule = recurrenceRule;
    if (reminders !== undefined) event.reminders = reminders;
    
    if (attachments !== undefined) {
      // If we are passing an entirely new array of attachments, overwrite.
      event.attachments = attachments;
    }

    await event.save();

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// GET /api/events/:id/comments
// Get comments for an event
// ══════════════════════════════════════════════════════════
const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { familyId } = req.user;
    
    // Check if event exists in this family
    const event = await Event.findOne({ _id: id, familyId });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const comments = await Comment.find({ onModel: 'Event', onDocument: id, family: familyId })
      .populate('author', 'fullName avatar')
      .sort({ createdAt: 1 });

    return res.status(200).json({ success: true, data: { comments } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// POST /api/events/:id/comments
// Add a comment to an event
// ══════════════════════════════════════════════════════════
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const { familyId, _id: userId } = req.user;

    if (!content) return res.status(400).json({ success: false, message: 'Content is required' });

    const event = await Event.findOne({ _id: id, familyId });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const comment = await Comment.create({
      author: userId,
      family: familyId,
      onModel: 'Event',
      onDocument: id,
      content,
    });

    await comment.populate('author', 'fullName avatar');

    // Notify participants
    notifyFamilyMembers({
      familyId,
      excludeUserId: userId,
      type: 'event_comment',
      title: 'New Event Comment',
      body: `${req.user.fullName} commented: ${content}`,
      data: { eventId: String(event._id) },
    });

    return res.status(201).json({ success: true, data: { comment } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createEvent,
  getFamilyEvents,
  getEventDetails,
  respondToEvent,
  updateEvent,
  deleteEvent,
  getComments,
  addComment,
};
