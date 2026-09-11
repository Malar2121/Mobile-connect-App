/** Notification types hidden from Minor mode (sensitive / private). */
const MINOR_HIDDEN_TYPES = new Set(['chat_message']);

export function filterNotificationsForMode(notifications, uiMode) {
  if (uiMode !== 'minor') return notifications;
  return notifications.filter((n) => !MINOR_HIDDEN_TYPES.has(n.type));
}

export function countUnread(notifications) {
  return notifications.filter((n) => !n.isRead).length;
}

export function formatNotificationTime(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  if (diffMs < 60_000) return 'Just now';
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  if (diffMs < 604_800_000) {
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  }

  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function getNotificationIcon(type) {
  switch (type) {
    case 'chat_message':
    case 'chat_mention':
      return 'chatbubble-outline';
    case 'memory_uploaded':
    case 'memory_approved':
      return 'images-outline';
    case 'memory_review_requested':
      return 'shield-checkmark-outline';
    case 'memory_rejected':
      return 'eye-off-outline';
    case 'event_created':
      return 'calendar-outline';
    default:
      return 'notifications-outline';
  }
}

/**
 * Resolve navigation target from push / in-app notification payload.
 */
export function getNavigationTarget(notification) {
  const type = notification?.type ?? notification?.data?.type;
  const data = notification?.data ?? {};

  switch (type) {
    case 'chat_message':
    case 'chat_mention':
      return { tab: 'Chat' };
    case 'memory_review_requested':
      return { tab: 'Memories', screen: 'MemoryApprovals' };
    case 'memory_uploaded':
    case 'memory_approved':
    case 'memory_rejected':
      if (data.memoryId) {
        return { tab: 'Memories', screen: 'MemoryDetails', params: { id: String(data.memoryId) } };
      }
      return { tab: 'Memories', screen: 'MemoriesHome' };
    case 'event_created':
      if (data.eventId) {
        return {
          tab: 'Events',
          screen: 'EventDetails',
          params: { id: String(data.eventId) },
        };
      }
      return { tab: 'Events', screen: 'EventsHome' };
    default:
      return { tab: 'Profile', screen: 'Notifications' };
  }
}

/** @typedef {{ type?: string, title?: string, body?: string, data?: object }} NotificationPayload */

export function extractNotificationData(response) {
  const content = response?.notification?.request?.content;
  const data = content?.data ?? {};
  return {
    type: data.type,
    title: content?.title,
    body: content?.body,
    data,
  };
}
