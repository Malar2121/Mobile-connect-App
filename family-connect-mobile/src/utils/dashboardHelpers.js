import { filterNotificationsForMode, formatNotificationTime, getNotificationIcon } from './notificationHelpers';
import { getMyRsvpStatus } from './eventFormat';
import { getUploader, getLikeCount } from './memoryHelpers';
import { getReadByIds, getSenderId } from './chatHelpers';

export function getGreeting(t) {
  const hour = new Date().getHours();
  if (t) {
    if (hour < 12) return t('dashboard.greetingMorning');
    if (hour < 17) return t('dashboard.greetingAfternoon');
    return t('dashboard.greetingEvening');
  }
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatTodayDate(locale) {
  const tag = locale === 'ta' ? 'ta-LK' : locale === 'si' ? 'si-LK' : 'en-US';
  return new Date().toLocaleDateString(tag, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function pickUpcomingEvents(events, limit = 5) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return [...events]
    .filter((e) => e.date && new Date(e.date) >= start)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, limit);
}

export function countLiveMembers(locations) {
  const cutoff = Date.now() - 15 * 60 * 1000;
  return locations.filter((loc) => {
    const ts = loc?.updatedAt || loc?.lastUpdated;
    return ts && new Date(ts).getTime() >= cutoff;
  }).length;
}

export function countUnreadNotifications(notifications, uiMode) {
  const visible = filterNotificationsForMode(notifications ?? [], uiMode);
  return visible.filter((n) => !n.isRead).length;
}

export function countUnreadMessages(messages, userId) {
  if (!userId || !messages?.length) return 0;
  const uid = String(userId);
  return messages.filter((m) => {
    const sender = getSenderId(m);
    if (sender === uid) return false;
    const readIds = getReadByIds(m);
    return !readIds.includes(uid);
  }).length;
}

export function countMemoriesSince(memories, sinceDate) {
  const since = sinceDate.getTime();
  return (memories ?? []).filter((m) => {
    const t = m.createdAt ? new Date(m.createdAt).getTime() : 0;
    return t >= since;
  }).length;
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfTomorrow() {
  const d = startOfToday();
  d.setDate(d.getDate() + 1);
  return d;
}

export function isSameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function inferEventCategory(title = '') {
  const t = title.toLowerCase();
  if (t.includes('birthday')) return { label: 'Birthday', color: 'warm' };
  if (t.includes('dinner') || t.includes('lunch') || t.includes('meal')) return { label: 'Meal', color: 'sunset' };
  if (t.includes('trip') || t.includes('travel') || t.includes('vacation')) return { label: 'Trip', color: 'cool' };
  if (t.includes('anniversary')) return { label: 'Anniversary', color: 'warm' };
  return { label: 'Gathering', color: 'mint' };
}

export function getEventCountdown(event) {
  if (!event?.date) return null;
  const eventDate = new Date(event.date);
  if (Number.isNaN(eventDate.getTime())) return null;

  const now = new Date();
  const today = startOfToday();
  const eventDay = new Date(eventDate);
  eventDay.setHours(0, 0, 0, 0);

  const dayDiff = Math.round((eventDay - today) / (24 * 60 * 60 * 1000));

  if (dayDiff === 0) {
    if (event.startTime) {
      const [h, m] = event.startTime.split(':').map(Number);
      if (!Number.isNaN(h)) {
        const start = new Date(eventDate);
        start.setHours(h, m || 0, 0, 0);
        const ms = start - now;
        if (ms > 0) {
          const hrs = Math.floor(ms / 3_600_000);
          const mins = Math.floor((ms % 3_600_000) / 60_000);
          return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
        }
      }
    }
    return 'Today';
  }
  if (dayDiff === 1) return 'Tomorrow';
  if (dayDiff > 1 && dayDiff <= 7) return `${dayDiff} days`;
  return null;
}

export function getEventRsvpProgress(event) {
  const guests = event?.guests ?? [];
  if (!guests.length) return { responded: 0, total: 0, pct: 0 };
  const responded = guests.filter((g) => g.status && g.status !== 'pending').length;
  return {
    responded,
    total: guests.length,
    pct: Math.round((responded / guests.length) * 100),
  };
}

/**
 * Reminders derived from real upcoming events (today / tomorrow / this week).
 */
export function deriveReminders(events) {
  const today = startOfToday();
  const tomorrow = startOfTomorrow();
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return [...events]
    .filter((e) => e.date && new Date(e.date) >= today && new Date(e.date) <= weekEnd)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((event) => {
      const eventDate = new Date(event.date);
      let priority = 'normal';
      let timeLabel = '';

      if (isSameDay(eventDate, today)) {
        priority = 'high';
        timeLabel = event.startTime ? `Today at ${event.startTime}` : 'Today';
      } else if (isSameDay(eventDate, tomorrow)) {
        priority = 'medium';
        timeLabel = event.startTime ? `Tomorrow at ${event.startTime}` : 'Tomorrow';
      } else {
        timeLabel = eventDate.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
      }

      const category = inferEventCategory(event.title);

      return {
        id: String(event._id),
        title: event.title,
        subtitle: event.location || timeLabel,
        timeLabel,
        priority,
        category: category.label,
        countdown: getEventCountdown(event),
        event,
      };
    });
}

export function buildActivityFeed(notifications, memories, members, uiMode) {
  const items = [];
  const visibleNotifs = filterNotificationsForMode(notifications ?? [], uiMode);

  visibleNotifs.slice(0, 12).forEach((n) => {
    items.push({
      id: `n-${n._id}`,
      type: n.type,
      title: n.title || 'Family update',
      body: n.body,
      time: formatNotificationTime(n.createdAt),
      timestamp: new Date(n.createdAt).getTime(),
      icon: getNotificationIcon(n.type),
      actorName: null,
      avatar: null,
    });
  });

  (memories ?? []).slice(0, 8).forEach((m) => {
    const uploader = getUploader(m);
    items.push({
      id: `m-${m._id}`,
      type: 'memory_uploaded',
      title: `${uploader.fullName ?? 'Someone'} shared a memory`,
      body: m.caption || (m.mediaType === 'video' ? 'New video' : 'New photo'),
      time: formatNotificationTime(m.createdAt),
      timestamp: new Date(m.createdAt).getTime(),
      icon: 'images-outline',
      actorName: uploader.fullName,
      avatar: uploader.avatar,
    });
  });

  return items
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);
}

export function deriveInsights(events, memories, messages, members, userId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const eventsThisMonth = (events ?? []).filter(
    (e) => e.createdAt && new Date(e.createdAt) >= monthStart,
  ).length;

  const memoriesThisMonth = (memories ?? []).filter(
    (m) => m.createdAt && new Date(m.createdAt) >= monthStart,
  ).length;

  const messagesThisWeek = (messages ?? []).filter(
    (m) => m.createdAt && new Date(m.createdAt) >= weekStart,
  ).length;

  const uploadCounts = {};
  (memories ?? []).forEach((m) => {
    const u = getUploader(m);
    const id = String(u._id ?? 'unknown');
    uploadCounts[id] = (uploadCounts[id] ?? 0) + 1;
  });

  const messageCounts = {};
  (messages ?? []).forEach((m) => {
    const id = getSenderId(m);
    if (id) messageCounts[id] = (messageCounts[id] ?? 0) + 1;
  });

  const combined = {};
  Object.keys(uploadCounts).forEach((id) => {
    combined[id] = (combined[id] ?? 0) + uploadCounts[id] * 2;
  });
  Object.keys(messageCounts).forEach((id) => {
    combined[id] = (combined[id] ?? 0) + messageCounts[id];
  });

  let topMemberId = null;
  let topScore = 0;
  Object.entries(combined).forEach(([id, score]) => {
    if (score > topScore) {
      topScore = score;
      topMemberId = id;
    }
  });

  const topMember = (members ?? []).find((m) => String(m._id) === topMemberId);

  let totalRsvp = 0;
  let respondedRsvp = 0;
  (events ?? []).forEach((e) => {
    const p = getEventRsvpProgress(e);
    totalRsvp += p.total;
    respondedRsvp += p.responded;
  });
  const participationPct = totalRsvp > 0 ? Math.round((respondedRsvp / totalRsvp) * 100) : 0;

  return {
    mostActiveMember: topMember?.fullName ?? '—',
    mostActiveAvatar: topMember?.avatar,
    eventsThisMonth,
    memoriesThisMonth,
    messagesThisWeek,
    participationPct,
    totalMemories: (memories ?? []).length,
    totalEvents: (events ?? []).length,
  };
}

export function deriveWeeklyActivity(events, memories, messages) {
  const days = [];
  const today = startOfToday();

  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);

    const count =
      (events ?? []).filter((e) => {
        const t = e.createdAt ? new Date(e.createdAt) : null;
        return t && t >= d && t < next;
      }).length +
      (memories ?? []).filter((m) => {
        const t = m.createdAt ? new Date(m.createdAt) : null;
        return t && t >= d && t < next;
      }).length +
      (messages ?? []).filter((m) => {
        const t = m.createdAt ? new Date(m.createdAt) : null;
        return t && t >= d && t < next;
      }).length;

    days.push({
      key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
      label: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
      count,
      isToday: i === 0,
    });
  }

  const max = Math.max(1, ...days.map((d) => d.count));
  return days.map((d) => ({ ...d, pct: d.count / max }));
}

export { getLikeCount, getUploader };
