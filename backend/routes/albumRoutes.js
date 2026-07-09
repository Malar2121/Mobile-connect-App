const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createAlbum, getAlbums, getAlbum, updateAlbum, addMediaToAlbum, shareAlbum, deleteAlbum,
} = require('../controllers/albumController');
const { protect, requireFamily } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(protect, requireFamily);

router.post(
  '/',
  [body('title').trim().notEmpty().withMessage('Album title is required')],
  validate,
  createAlbum
);

router.get('/', getAlbums);
router.get('/:id', getAlbum);
router.put('/:id', updateAlbum);
router.post('/:id/add-media', addMediaToAlbum);
router.post('/:id/share', shareAlbum);
router.delete('/:id', deleteAlbum);

module.exports = router;
