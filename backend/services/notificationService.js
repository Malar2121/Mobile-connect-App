const { admin, isInitialized } = require('../config/firebase');
const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Send a push notification via Firebase Cloud Messaging
 */
const sendPush = async ({ tokens, title, body, data = {} }) => {
  if (!tokens || tokens.length === 0) return null;
  if (!isInitialized()) return null; // Firebase not configured — skip silently

  // Convert data values to strings for FCM
  const stringData = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]));

  const message = {
    notification: { title, body },
    data: stringData,
    android: { notification: { sound: 'default', channelId: 'family_connect_main', priority: 'HIGH' } },
    apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    logger.info(`FCM: ${response.successCount} sent, ${response.failureCount} failed`);
    return response;
  } catch (err) {
    logger.error(`FCM send error: ${err.message}`);
    return null;
  }
};

/**
 * Automatically create Notification items for an entire family array of Users
 * and push via FCM if tokens exist.
 */
const notifyFamilyMembers = async ({ familyId, excludeUserId, type, title, body, data = {} }) => {
  try {
    // 1. Get all members of the family except the triggerer
    const users = await User.find({ familyId, _id: { $ne: excludeUserId } });

    if (users.length === 0) return;

    for (const user of users) {
      // 2. Insert into DB Notification model
      await Notification.create({
        recipient: user._id,
        familyId,
        type,
        title,
        body,
        data,
      });

      // 3. Send via Push if appropriate
      if (user.fcmTokens && user.fcmTokens.length > 0) {
        const tokens = user.fcmTokens.map((t) => t.token);
        await sendPush({ tokens, title, body, data });
      }
    }
  } catch (err) {
    logger.error(`notifyFamilyMembers error: ${err.message}`);
  }
};

module.exports = { sendPush, notifyFamilyMembers };
