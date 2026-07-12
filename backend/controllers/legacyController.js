const LegacyProfile = require('../models/LegacyProfile');
const FamilyMember = require('../models/FamilyMember');
const { notifyFamilyMembers } = require('../services/notificationService');

// GET /api/legacy
// Fetch all legacy profiles for a family
const getLegacyProfiles = async (req, res) => {
  try {
    const { familyId } = req.user;
    if (!familyId) return res.status(403).json({ success: false, message: 'You must belong to a family' });

    const profiles = await LegacyProfile.find({ familyId })
      .populate('memberId', 'fullName avatar dateOfBirth')
      .populate('tributes.author', 'fullName avatar');

    return res.status(200).json({ success: true, data: { profiles } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/legacy/:id
// Fetch a specific legacy profile
const getLegacyProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { familyId } = req.user;

    const profile = await LegacyProfile.findOne({ _id: id, familyId })
      .populate('memberId', 'fullName avatar dateOfBirth')
      .populate('tributes.author', 'fullName avatar');

    if (!profile) return res.status(404).json({ success: false, message: 'Legacy profile not found' });

    return res.status(200).json({ success: true, data: { profile } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/legacy
// Create a legacy profile for a deceased family member
const createLegacyProfile = async (req, res) => {
  try {
    const { memberId, biography, deathDate, burialLocation } = req.body;
    const { familyId, role } = req.user;

    if (role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can create legacy profiles' });
    }

    const member = await FamilyMember.findOne({ user: memberId, family: familyId });
    if (!member) return res.status(404).json({ success: false, message: 'Family member not found' });

    // Check if profile already exists
    let profile = await LegacyProfile.findOne({ memberId, familyId });
    if (profile) return res.status(400).json({ success: false, message: 'Legacy profile already exists' });

    profile = await LegacyProfile.create({
      memberId,
      familyId,
      biography,
      deathDate,
      burialLocation,
      tributes: [],
    });

    await profile.populate('memberId', 'fullName avatar dateOfBirth');

    notifyFamilyMembers({
      familyId,
      excludeUserId: req.user._id,
      type: 'legacy_created',
      title: 'Legacy Profile Created',
      body: `A memorial profile has been created for ${profile.memberId.fullName}.`,
    });

    return res.status(201).json({ success: true, data: { profile } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/legacy/:id/tributes
// Add a tribute to a legacy profile
const addTribute = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const { familyId, _id: userId } = req.user;

    if (!content) return res.status(400).json({ success: false, message: 'Tribute content is required' });

    const profile = await LegacyProfile.findOne({ _id: id, familyId });
    if (!profile) return res.status(404).json({ success: false, message: 'Legacy profile not found' });

    profile.tributes.push({ author: userId, content });
    await profile.save();

    await profile.populate('tributes.author', 'fullName avatar');

    notifyFamilyMembers({
      familyId,
      excludeUserId: userId,
      type: 'legacy_tribute',
      title: 'New Tribute',
      body: `${req.user.fullName} shared a tribute on a memorial profile.`,
    });

    return res.status(201).json({ success: true, data: { profile } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLegacyProfiles,
  getLegacyProfile,
  createLegacyProfile,
  addTribute,
};
