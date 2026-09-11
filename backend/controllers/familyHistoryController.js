const Family = require('../models/Family');

/**
 * The shared family history journal — origins, traditions and the stories
 * passed down through generations. Stored on the family so every member sees
 * the same text on every device.
 */
const FIELDS = ['origins', 'traditions', 'culturalNotes', 'importantEvents', 'achievements', 'historicalMemories'];
const FIELD_MAX = 5000;

function serialize(family) {
  const history = family?.history ?? {};
  const out = {};
  FIELDS.forEach((field) => {
    out[field] = history[field] ?? '';
  });
  out.updatedAt = history.updatedAt ?? null;
  out.updatedBy = history.updatedBy ?? null;
  return out;
}

// GET /api/family/history
const getFamilyHistory = async (req, res) => {
  try {
    if (!req.user.familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family' });
    }

    const family = await Family.findById(req.user.familyId)
      .select('history')
      .populate('history.updatedBy', 'fullName');
    if (!family) return res.status(404).json({ success: false, message: 'Family not found' });

    return res.status(200).json({ success: true, data: serialize(family) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/family/history
const updateFamilyHistory = async (req, res) => {
  try {
    const { familyId, _id: userId } = req.user;
    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family' });
    }

    const update = {};
    for (const field of FIELDS) {
      if (req.body?.[field] === undefined) continue;
      const value = String(req.body[field] ?? '').trim();
      if (value.length > FIELD_MAX) {
        return res.status(400).json({ success: false, message: `${field} can be at most ${FIELD_MAX} characters` });
      }
      update[`history.${field}`] = value;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    update['history.updatedBy'] = userId;
    update['history.updatedAt'] = new Date();

    const family = await Family.findByIdAndUpdate(familyId, { $set: update }, { new: true })
      .select('history')
      .populate('history.updatedBy', 'fullName');
    if (!family) return res.status(404).json({ success: false, message: 'Family not found' });

    return res.status(200).json({ success: true, message: 'Family history saved', data: serialize(family) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getFamilyHistory, updateFamilyHistory, HISTORY_FIELDS: FIELDS };
