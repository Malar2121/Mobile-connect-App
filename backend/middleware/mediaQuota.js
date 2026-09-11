const { familyQuotaBytes, familyUsageBytes } = require('../services/memoryPolicy');

/**
 * Refuse an upload before it reaches cloud storage when the family has used
 * its media allowance (proposal §5.5: storage costs "managed by compressing
 * media and setting quotas"). Runs before multer, so a refused file is never
 * sent to Cloudinary.
 */
async function enforceMediaQuota(req, res, next) {
  try {
    if (!req.user?.familyId) return next();

    const quotaBytes = familyQuotaBytes();
    const usedBytes = await familyUsageBytes(req.user.familyId);
    const incomingBytes = Number(req.headers['content-length']) || 0;

    if (usedBytes + incomingBytes > quotaBytes) {
      return res.status(413).json({
        success: false,
        code: 'MEDIA_QUOTA_EXCEEDED',
        message: 'Your family has used its media storage allowance. Delete some memories before uploading more.',
        data: { usedBytes, quotaBytes },
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { enforceMediaQuota };
