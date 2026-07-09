const Album = require('../models/Album');
const Memory = require('../models/Memory');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { getPaginationOptions } = require('../utils/helpers');
const { v4: uuidv4 } = require('uuid');

// ──────────────────────────────────────────
//  POST /api/albums
// ──────────────────────────────────────────
const createAlbum = asyncHandler(async (req, res) => {
  const { title, description, eventId } = req.body;

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
  const [media, mediaTotal] = await Promise.all([
    Memory.find({
      familyId: req.user.familyId,
      $or: [{ album: album._id }, { album: albumIdStr }],
    })
      .populate('uploadedBy', 'fullName avatar')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Memory.countDocuments({
      familyId: req.user.familyId,
      $or: [{ album: album._id }, { album: albumIdStr }],
    }),
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
  if (coverMemoryId) album.coverMemory = coverMemoryId;

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
    { _id: { $in: memoryIds }, familyId: req.user.familyId },
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

  if (!album.shareLink) {
    album.shareLink = `${process.env.CLIENT_URL}/shared-album/${uuidv4()}`;
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
