const { admin, isInitialized } = require('../config/firebase');
const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../utils/logger');
const { renderNotification } = require('./notificationText');

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
 * and push via FCM / Expo if tokens exist.
 */
const notifyFamilyMembers = async ({ familyId, excludeUserId, skipUserIds = [], type, title, body, data = {}, params }) => {
  try {
    // 1. Get all members of the family except the triggerer, and except anyone
    //    already alerted more specifically (e.g. @mentioned in this message).
    const skip = new Set(skipUserIds.map(String));
    const users = (await User.find({ familyId, _id: { $ne: excludeUserId } })).filter(
      (u) => !skip.has(String(u._id)),
    );

    if (users.length === 0) return;
    const fallback = { title, body };

    for (const user of users) {
      // Each member reads the notification in the language they chose.
      const { title, body } = renderNotification(type, params, user.language) ?? fallback;
      // Check pushPreferences based on type
      let shouldPush = true;
      if (type.startsWith('chat_') && user.pushPreferences?.chat === false) shouldPush = false;
      if (type.startsWith('event_') && user.pushPreferences?.events === false) shouldPush = false;
      if (type.startsWith('memory_') && user.pushPreferences?.memories === false) shouldPush = false;
      if (type.startsWith('geofence_') && user.pushPreferences?.location === false) shouldPush = false;

      // 2. Insert into DB Notification model
      await Notification.create({
        recipient: user._id,
        familyId,
        type,
        title,
        body,
        data,
      });

      if (shouldPush) {
        // 3. Send via FCM if appropriate
        if (user.fcmTokens && user.fcmTokens.length > 0) {
          const tokens = user.fcmTokens.map((t) => t.token);
          await sendPush({ tokens, title, body, data });
        }

        // 4. Send via Expo Push if appropriate
        if (user.pushToken && user.pushToken.startsWith('ExponentPushToken')) {
          try {
            await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: user.pushToken,
                sound: 'default',
                title,
                body,
                data,
              }),
            });
          } catch (error) {
            logger.error(`Expo push error: ${error.message}`);
          }
        }
      }
    }
  } catch (err) {
    logger.error(`notifyFamilyMembers error: ${err.message}`);
  }
};

/**
 * Notify a specific set of users rather than the whole family.
 * Used for @mentions, where only the people named should be alerted.
 */
const notifyUsers = async ({ userIds, familyId, excludeUserId, type, title, body, data = {}, params }) => {
  try {
    const ids = [...new Set((userIds || []).map(String))].filter(
      (id) => !excludeUserId || id !== String(excludeUserId),
    );
    if (ids.length === 0) return;

    // Scoped by familyId so a caller can never notify outside its own family.
    const users = await User.find({ _id: { $in: ids }, familyId });
    const fallback = { title, body };

    for (const user of users) {
      const { title, body } = renderNotification(type, params, user.language) ?? fallback;
      await Notification.create({ recipient: user._id, familyId, type, title, body, data });

      if (user.fcmTokens?.length) {
        await sendPush({ tokens: user.fcmTokens.map((t) => t.token), title, body, data });
      }

      if (user.pushToken && user.pushToken.startsWith('ExponentPushToken')) {
        try {
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ to: user.pushToken, sound: 'default', title, body, data }),
          });
        } catch (error) {
          logger.error(`Expo push error: ${error.message}`);
        }
      }
    }
  } catch (err) {
    logger.error(`notifyUsers error: ${err.message}`);
  }
};

module.exports = { sendPush, notifyFamilyMembers, notifyUsers };
