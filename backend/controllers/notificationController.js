const Notification = require('../models/Notification');
const { sendPush } = require('../services/notificationService');
const User = require('../models/User');

// ══════════════════════════════════════════════════════════
// POST /api/notifications/create
// Advanced method for creating push + in-app notification
// ══════════════════════════════════════════════════════════
const createNotification = async (req, res) => {
  try {
    const { recipientIds, type, title, body, data } = req.body;
    const { familyId, role } = req.user;

    if (!familyId) {
      return res.status(403).json({ success: false, message: 'You must belong to a family' });
    }

    // Only family admins may broadcast manual notifications (prevents spam / phishing pushes)
    if (role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only family admins can send notifications' });
    }

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return res.status(400).json({ success: false, message: 'recipientIds array is required' });
    }

    const recipients = await User.find({ _id: { $in: recipientIds }, familyId });
    const createdNotifications = [];

    for (const recipient of recipients) {
      const notification = await Notification.create({
        recipient: recipient._id,
        familyId,
        type,
        title,
        body,
        data: data || {},
      });

      createdNotifications.push(notification);

      // Send Firebase Push if tokens exist
      if (recipient.fcmTokens && recipient.fcmTokens.length > 0) {
        const tokens = recipient.fcmTokens.map((t) => t.token);
        await sendPush({
          tokens,
          title,
          body,
          data: data || {},
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Notifications created and pushes dispatched via FCM',
      data: createdNotifications,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// GET /api/notifications
// Get all notifications for the logged in user
// ══════════════════════════════════════════════════════════
const getNotifications = async (req, res) => {
  try {
    const { _id: userId } = req.user;

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(50); // limit to recent 50 for performance

    return res.status(200).json({
      success: true,
      message: 'Notifications retrieved',
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// PUT /api/notifications/read/:id
// Mark a notification as read
// ══════════════════════════════════════════════════════════
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id: userId } = req.user;

    const notification = await Notification.findOne({ _id: id, recipient: userId });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// DELETE /api/notifications/:id
// Delete a specific notification
// ══════════════════════════════════════════════════════════
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id: userId } = req.user;

    const notification = await Notification.findOne({ _id: id, recipient: userId });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await Notification.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: 'Notification deleted',
      data: {},
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  deleteNotification,
};
