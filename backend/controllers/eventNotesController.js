const Comment = require('../models/Comment');

/**
 * GET /api/events/notes
 *
 * Recent event notes across the whole family, so the memory archive can show
 * them beside photos, videos and stories (proposal §6.3: "a central space for
 * storing and viewing family photos, short videos, and event notes").
 */
const getRecentEventNotes = async (req, res) => {
  try {
    const { familyId } = req.user;
    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family' });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);

    const notes = await Comment.find({ family: familyId, onModel: 'Event' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', 'fullName avatar')
      .populate({ path: 'onDocument', select: 'title date familyId', model: 'Event' });

    // Scope again on the event itself, so a note can never surface an event
    // that belongs to another family.
    const data = notes
      .filter((note) => note.onDocument && String(note.onDocument.familyId) === String(familyId))
      .map((note) => ({
        _id: note._id,
        content: note.content,
        createdAt: note.createdAt,
        author: note.author,
        event: { _id: note.onDocument._id, title: note.onDocument.title, date: note.onDocument.date },
      }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getRecentEventNotes };
