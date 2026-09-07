const Celebration = require('../models/Celebration');
const User = require('../models/User');
const { birthdaysFromMembers, decorate } = require('../utils/celebrations');

const EDITABLE_TYPES = ['anniversary', 'cultural', 'other'];

/** Only the creator or a family admin may change a stored celebration. */
function canManage(celebration, user) {
  return String(celebration.createdBy) === String(user._id) || user.role === 'admin';
}

// ──────────────────────────────────────────────────────────
// GET /api/celebrations?days=365
// Stored celebrations plus birthdays derived from member profiles,
// each with its next occurrence, sorted by how soon it falls.
// ──────────────────────────────────────────────────────────
const getCelebrations = async (req, res) => {
  try {
    const { familyId } = req.user;
    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family to view celebrations' });
    }

    const windowDays = Math.min(Math.max(parseInt(req.query.days, 10) || 365, 1), 3650);
    const now = new Date();

    const [stored, members] = await Promise.all([
      Celebration.find({ familyId })
        .populate('relatedMembers', 'fullName avatar')
        .populate('createdBy', 'fullName'),
      User.find({ familyId }).select('fullName avatar dateOfBirth'),
    ]);

    const celebrations = [
      ...stored.map((c) => decorate(c, now)),
      ...birthdaysFromMembers(members, now),
    ]
      .filter((c) => c.nextOccurrence && c.daysUntil <= windowDays)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return res.status(200).json({
      success: true,
      message: 'Celebrations retrieved',
      data: celebrations,
      meta: { windowDays, total: celebrations.length },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// POST /api/celebrations
// ──────────────────────────────────────────────────────────
const createCelebration = async (req, res) => {
  try {
    const { familyId, _id: userId } = req.user;
    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family to add a celebration' });
    }

    const { type, title, description, date, recurrence, relatedMembers, reminderDaysBefore } = req.body;

    if (!EDITABLE_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `type must be one of: ${EDITABLE_TYPES.join(', ')}. Birthdays come from each member's date of birth.`,
      });
    }
    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    const when = new Date(date);
    if (!date || Number.isNaN(when.getTime())) {
      return res.status(400).json({ success: false, message: 'A valid date is required' });
    }

    // Related members must be in the caller's own family.
    let validMembers = [];
    if (Array.isArray(relatedMembers) && relatedMembers.length > 0) {
      const found = await User.find({ _id: { $in: relatedMembers }, familyId }).select('_id');
      if (found.length !== relatedMembers.length) {
        return res.status(400).json({ success: false, message: 'Related members must belong to your family' });
      }
      validMembers = found.map((u) => u._id);
    }

    const celebration = await Celebration.create({
      familyId,
      type,
      title: title.trim(),
      description: description?.trim() ?? '',
      date: when,
      recurrence: recurrence === 'once' ? 'once' : 'annual',
      relatedMembers: validMembers,
      reminderDaysBefore: Array.isArray(reminderDaysBefore) ? reminderDaysBefore : undefined,
      createdBy: userId,
    });

    await celebration.populate('relatedMembers', 'fullName avatar');
    await celebration.populate('createdBy', 'fullName');

    return res.status(201).json({
      success: true,
      message: 'Celebration created',
      data: decorate(celebration),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'That celebration already exists for your family' });
    }
    if (error.name === 'ValidationError') {
      return res.status(422).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// GET /api/celebrations/:id
// ──────────────────────────────────────────────────────────
const getCelebration = async (req, res) => {
  try {
    const { familyId } = req.user;
    const celebration = await Celebration.findOne({ _id: req.params.id, familyId })
      .populate('relatedMembers', 'fullName avatar')
      .populate('createdBy', 'fullName');

    if (!celebration) {
      return res.status(404).json({ success: false, message: 'Celebration not found' });
    }
    return res.status(200).json({ success: true, data: decorate(celebration) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// PUT /api/celebrations/:id
// ──────────────────────────────────────────────────────────
const updateCelebration = async (req, res) => {
  try {
    const { familyId } = req.user;
    const celebration = await Celebration.findOne({ _id: req.params.id, familyId });
    if (!celebration) {
      return res.status(404).json({ success: false, message: 'Celebration not found' });
    }
    if (!canManage(celebration, req.user)) {
      return res.status(403).json({ success: false, message: 'Only the creator or a family admin can edit this celebration' });
    }

    const { type, title, description, date, recurrence, relatedMembers, reminderDaysBefore } = req.body;

    if (type !== undefined) {
      if (!EDITABLE_TYPES.includes(type)) {
        return res.status(400).json({ success: false, message: `type must be one of: ${EDITABLE_TYPES.join(', ')}` });
      }
      celebration.type = type;
    }
    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ success: false, message: 'Title cannot be empty' });
      celebration.title = title.trim();
    }
    if (description !== undefined) celebration.description = description.trim();
    if (date !== undefined) {
      const when = new Date(date);
      if (Number.isNaN(when.getTime())) {
        return res.status(400).json({ success: false, message: 'A valid date is required' });
      }
      celebration.date = when;
    }
    if (recurrence !== undefined) celebration.recurrence = recurrence === 'once' ? 'once' : 'annual';
    if (reminderDaysBefore !== undefined) celebration.reminderDaysBefore = reminderDaysBefore;
    if (relatedMembers !== undefined) {
      const found = await User.find({ _id: { $in: relatedMembers }, familyId }).select('_id');
      if (found.length !== relatedMembers.length) {
        return res.status(400).json({ success: false, message: 'Related members must belong to your family' });
      }
      celebration.relatedMembers = found.map((u) => u._id);
    }

    await celebration.save();
    await celebration.populate('relatedMembers', 'fullName avatar');
    await celebration.populate('createdBy', 'fullName');

    return res.status(200).json({ success: true, message: 'Celebration updated', data: decorate(celebration) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'That celebration already exists for your family' });
    }
    if (error.name === 'ValidationError') {
      return res.status(422).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// DELETE /api/celebrations/:id
// ──────────────────────────────────────────────────────────
const deleteCelebration = async (req, res) => {
  try {
    const { familyId } = req.user;
    const celebration = await Celebration.findOne({ _id: req.params.id, familyId });
    if (!celebration) {
      return res.status(404).json({ success: false, message: 'Celebration not found' });
    }
    if (!canManage(celebration, req.user)) {
      return res.status(403).json({ success: false, message: 'Only the creator or a family admin can delete this celebration' });
    }

    await celebration.deleteOne();
    return res.status(200).json({ success: true, message: 'Celebration deleted', data: {} });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCelebrations,
  createCelebration,
  getCelebration,
  updateCelebration,
  deleteCelebration,
};
