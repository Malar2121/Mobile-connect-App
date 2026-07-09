export function getSenderId(message) {
  const s = message?.sender;
  if (!s) return '';
  return String(s._id ?? s);
}

export function getSender(message) {
  const s = message?.sender;
  if (s && typeof s === 'object') return s;
  return { fullName: 'Family', avatar: null, _id: s };
}

export function isMyMessage(message, userId) {
  if (!userId) return false;
  return getSenderId(message) === String(userId);
}

export function getReadByIds(message) {
  return (message?.readBy ?? []).map((id) => String(id._id ?? id));
}

export function hasOtherReaders(message, userId) {
  const uid = String(userId);
  return getReadByIds(message).some((id) => id !== uid);
}

/**
 * Sent → saved on server, not read by others.
 * Delivered → saved and family has other members (message reached the family).
 * Seen → at least one other member appears in readBy.
 */
export function getOutgoingStatus(message, userId, familyMemberCount = 1) {
  if (message?.pending) return 'sending';
  if (!message?._id) return 'sent';

  if (hasOtherReaders(message, userId)) return 'seen';

  if (familyMemberCount > 1) return 'delivered';

  return 'sent';
}

export function formatMessageTime(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function messageKey(message) {
  if (message._id) return String(message._id);
  if (message.clientId) return message.clientId;
  return `tmp-${message.createdAt}`;
}

function findPendingMatch(list, incoming) {
  const incomingSender = getSenderId(incoming);
  const incomingText = (incoming.text ?? '').trim();
  const incomingMedia = incoming.mediaUrl ?? null;

  return list.findIndex((m) => {
    if (!m.pending) return false;
    if (getSenderId(m) !== incomingSender) return false;
    if ((m.text ?? '').trim() !== incomingText) return false;
    if ((m.mediaUrl ?? null) !== incomingMedia) return false;
    return true;
  });
}

export function upsertMessage(list, incoming) {
  const incomingId = incoming._id ? String(incoming._id) : null;
  const clientId = incoming.clientId;

  if (incomingId) {
    const byId = list.findIndex((m) => m._id && String(m._id) === incomingId);
    if (byId >= 0) {
      const next = [...list];
      next[byId] = { ...next[byId], ...incoming, pending: false };
      return next;
    }
  }

  if (clientId) {
    const byClient = list.findIndex((m) => m.clientId === clientId);
    if (byClient >= 0) {
      const next = [...list];
      next[byClient] = { ...incoming, pending: false };
      return next;
    }
  }

  if (incomingId) {
    const byPending = findPendingMatch(list, incoming);
    if (byPending >= 0) {
      const next = [...list];
      next[byPending] = {
        ...incoming,
        clientId: list[byPending].clientId,
        pending: false,
      };
      return next;
    }
  }

  if (incomingId && list.some((m) => m._id && String(m._id) === incomingId)) {
    return list;
  }

  return [...list, { ...incoming, pending: false }];
}

export function applyReadReceipt(list, messageId, readerUserId) {
  const mid = String(messageId);
  const rid = String(readerUserId);
  return list.map((m) => {
    if (String(m._id) !== mid) return m;
    const readBy = [...(m.readBy ?? [])];
    if (!readBy.some((id) => String(id._id ?? id) === rid)) {
      readBy.push(readerUserId);
    }
    return { ...m, readBy };
  });
}

export function createOptimisticMessage(text, user, extras = {}) {
  const now = new Date().toISOString();
  const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    clientId,
    _id: null,
    pending: true,
    text: text.trim(),
    sender: {
      _id: user._id,
      fullName: user.fullName,
      avatar: user.avatar,
    },
    readBy: [user._id],
    createdAt: now,
    mediaUrl: null,
    mediaType: null,
    replyTo: null,
    ...extras,
  };
}

export function formatDateSeparator(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today - target) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: 'long' });
  }
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function isSameDay(a, b) {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/**
 * Flatten messages into list items: date chips + messages.
 * @returns {{ type: 'date'|'message', key: string, dateLabel?: string, message?: object }[]}
 */
export function buildChatListItems(messages) {
  const items = [];
  let lastDate = null;

  messages.forEach((message) => {
    const createdAt = message.createdAt;
    if (!isSameDay(createdAt, lastDate)) {
      items.push({
        type: 'date',
        key: `date-${createdAt}`,
        dateLabel: formatDateSeparator(createdAt),
      });
      lastDate = createdAt;
    }
    items.push({
      type: 'message',
      key: messageKey(message),
      message,
    });
  });

  return items;
}

export function searchMessages(messages, query, editedTexts = {}) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return messages.filter((m) => {
    const text = editedTexts[String(m._id)] ?? m.text ?? '';
    const sender = getSender(m).fullName ?? '';
    return text.toLowerCase().includes(q) || sender.toLowerCase().includes(q);
  });
}

export function getUnreadCount(messages, userId, lastReadAt) {
  if (!lastReadAt) return 0;
  const cutoff = new Date(lastReadAt).getTime();
  return messages.filter((m) => {
    if (isMyMessage(m, userId)) return false;
    const t = new Date(m.createdAt).getTime();
    return t > cutoff;
  }).length;
}

export function getSeenByLabel(message, userId, familyMemberCount) {
  const status = getOutgoingStatus(message, userId, familyMemberCount);
  if (status === 'seen') {
    const others = getReadByIds(message).filter((id) => id !== String(userId));
    if (others.length >= familyMemberCount - 1) return 'Seen by everyone';
    return `Seen by ${others.length}`;
  }
  if (status === 'delivered') return 'Delivered';
  if (status === 'sent') return 'Sent';
  if (status === 'sending') return 'Sending…';
  return null;
}

export function highlightSearchText(text, query) {
  if (!query?.trim() || !text) return [{ text, highlight: false }];
  const q = query.trim();
  const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part) => ({
    text: part,
    highlight: part.toLowerCase() === q.toLowerCase(),
  }));
}

export function getMediaMessages(messages) {
  return messages.filter((m) => m.mediaUrl && (m.mediaType === 'image' || m.mediaType === 'video'));
}
