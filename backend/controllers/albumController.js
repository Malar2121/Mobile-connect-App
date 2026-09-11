const Album = require('../models/Album');
const mongoose = require('mongoose');
const Memory = require('../models/Memory');
const Event = require('../models/Event');
const { approvedOnly } = require('../services/memoryPolicy');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { getPaginationOptions } = require('../utils/helpers');
const { v4: uuidv4 } = require('uuid');

// ──────────────────────────────────────────
//  POST /api/albums
// ──────────────────────────────────────────
const createAlbum = asyncHandler(async (req, res) => {
  const { title, description, eventId } = req.body;

  // An album may only be linked to an event in the caller's own family.
  if (eventId) {
    const event = mongoose.isValidObjectId(eventId)
      ? await Event.findOne({ _id: eventId, familyId: req.user.familyId }).select('_id')
      : null;
    if (!event) return errorResponse(res, 'Event not found', 404);
  }

  const album = await Album.create({
    family: req.user.familyId,
    createdBy: req.user._id,
    title,
    description,
    event: eventId || null,
  });

  return successResponse(res, { album }, 'Album created', 201);
});

// ──────────────────────────────────────────
//  GET /api/albums
// ──────────────────────────────────────────
const getAlbums = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);

  const [albums, total] = await Promise.all([
    Album.find({ family: req.user.familyId })
      .populate('createdBy', 'fullName avatar')
      .populate('coverMemory', 'mediaUrl mediaType caption')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Album.countDocuments({ family: req.user.familyId }),
  ]);

  return paginatedResponse(res, albums, total, page, limit, 'Albums retrieved');
});

// ──────────────────────────────────────────
//  GET /api/albums/:id
// ──────────────────────────────────────────
const getAlbum = asyncHandler(async (req, res) => {
  const album = await Album.findOne({ _id: req.params.id, family: req.user.familyId })
    .populate('createdBy', 'fullName avatar')
    .populate('coverMemory', 'mediaUrl mediaType caption')
    .populate('event', 'title date startTime');

  if (!album) return errorResponse(res, 'Album not found', 404);

  // Fetch media in album
  const { page, limit, skip } = getPaginationOptions(req.query);
  const albumIdStr = String(album._id);
  // Pending and rejected memories never appear in an album.
  const mediaFilter = {
    familyId: req.user.familyId,
    $or: [{ album: album._id }, { album: albumIdStr }],
    ...approvedOnly(),
  };
  const [media, mediaTotal] = await Promise.all([
    Memory.find(mediaFilter)
      .populate('uploadedBy', 'fullName avatar')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Memory.countDocuments(mediaFilter),
  ]);

  return successResponse(res, {
    album,
    media,
    pagination: { total: mediaTotal, page, limit, pages: Math.ceil(mediaTotal / limit) },
  }, 'Album retrieved');
});

// ──────────────────────────────────────────
//  PUT /api/albums/:id
// ──────────────────────────────────────────
const updateAlbum = asyncHandler(async (req, res) => {
  const album = await Album.findOne({ _id: req.params.id, family: req.user.familyId });
  if (!album) return errorResponse(res, 'Album not found', 404);

  if (String(album.createdBy) !== String(req.user._id) && req.user.role !== 'admin') {
    return errorResponse(res, 'Not authorized to update this album', 403);
  }

  const { title, description, coverMemoryId } = req.body;
  if (title) album.title = title;
  if (description !== undefined) album.description = description;
  if (coverMemoryId) {
    // The cover must be an approved memory from this family.
    const cover = mongoose.isValidObjectId(coverMemoryId)
      ? await Memory.findOne({ _id: coverMemoryId, familyId: req.user.familyId, ...approvedOnly() }).select('_id')
      : null;
    if (!cover) return errorResponse(res, 'Cover memory not found', 404);
    album.coverMemory = cover._id;
  }

  await album.save();
  return successResponse(res, { album }, 'Album updated');
});

// ──────────────────────────────────────────
//  POST /api/albums/:id/add-media
// ──────────────────────────────────────────
const addMediaToAlbum = asyncHandler(async (req, res) => {
  const { memoryIds } = req.body; // array of Memory IDs

  if (!Array.isArray(memoryIds) || memoryIds.length === 0) {
    return errorResponse(res, 'memoryIds must be a non-empty array', 400);
  }

  const album = await Album.findOne({ _id: req.params.id, family: req.user.familyId });
  if (!album) return errorResponse(res, 'Album not found', 404);

  const result = await Memory.updateMany(
    // Only approved memories from this family can be filed in an album.
    {
      _id: { $in: memoryIds.filter((id) => mongoose.isValidObjectId(id)) },
      familyId: req.user.familyId,
      ...approvedOnly(),
    },
    { album: String(album._id) },
  );

  album.mediaCount += result.modifiedCount;
  await album.save();

  return successResponse(res, { addedCount: result.modifiedCount }, 'Media added to album');
});

// ──────────────────────────────────────────
//  POST /api/albums/:id/share
// ──────────────────────────────────────────
const shareAlbum = asyncHandler(async (req, res) => {
  const album = await Album.findOne({ _id: req.params.id, family: req.user.familyId });
  if (!album) return errorResponse(res, 'Album not found', 404);

  const clientUrl = process.env.CLIENT_URL;
  if (!clientUrl) return errorResponse(res, 'CLIENT_URL is not configured', 500);

  if (!album.shareLink) {
    album.shareLink = `${clientUrl}/shared-album/${uuidv4()}`;
  }
  album.isShared = true;
  await album.save();

  return successResponse(res, { shareLink: album.shareLink }, 'Album shared');
});

// ──────────────────────────────────────────
//  DELETE /api/albums/:id
// ──────────────────────────────────────────
const deleteAlbum = asyncHandler(async (req, res) => {
  const album = await Album.findOne({ _id: req.params.id, family: req.user.familyId });
  if (!album) return errorResponse(res, 'Album not found', 404);

  if (String(album.createdBy) !== String(req.user._id) && req.user.role !== 'admin') {
    return errorResponse(res, 'Not authorized to delete this album', 403);
  }

  // Unlink memories from album
  const albumIdStr = String(album._id);
  await Memory.updateMany(
    { $or: [{ album: album._id }, { album: albumIdStr }] },
    { album: '' },
  );
  await album.deleteOne();

  return successResponse(res, {}, 'Album deleted');
});

module.exports = { createAlbum, getAlbums, getAlbum, updateAlbum, addMediaToAlbum, shareAlbum, deleteAlbum };
