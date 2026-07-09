const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Generic storage factory
const createStorage = (folder, allowedFormats, resourceType = 'image') =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `family_connect/${folder}`,
      allowed_formats: allowedFormats,
      resource_type: resourceType,
      transformation: resourceType === 'image' ? [{ quality: 'auto', fetch_format: 'auto' }] : [],
    },
  });

// Upload configs for different use cases
const avatarUpload = multer({
  storage: createStorage('avatars', ['jpg', 'jpeg', 'png', 'webp']),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

const memoryUpload = multer({
  storage: createStorage('memories', ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov'], 'auto'),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024 },
});

const chatUpload = multer({
  storage: createStorage('chat_media', ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'm4a', 'aac', 'mp3', 'pdf', 'doc', 'docx'], 'auto'),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024 },
});

module.exports = { cloudinary, avatarUpload, memoryUpload, chatUpload };
