import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  inferEventCategory,
  getEventCountdown,
  getEventRsvpProgress,
  pickUpcomingEvents,
  startOfToday,
  isSameDay,
} from './dashboardHelpers';
import { getMyRsvpStatus, guestEntryUserId, resolveEventCreatorName } from './eventFormat';

export const EVENT_CATEGORIES = [
  { id: 'gathering', label: 'Gathering', color: '#10B981' },
  { id: 'birthday', label: 'Birthday', color: '#F59E0B' },
  { id: 'anniversary', label: 'Anniversary', color: '#EC4899' },
  { id: 'meal', label: 'Meal', color: '#F97316' },
  { id: 'trip', label: 'Trip', color: '#0EA5E9' },
  { id: 'holiday', label: 'Holiday', color: '#8B5CF6' },
];

const REMINDER_KEY = (familyId) => `fc_event_reminders_${familyId}`;
const ATTACHMENT_KEY = (eventId) => `fc_event_attachments_${eventId}`;
const META_KEY = (eventId) => `fc_event_meta_${eventId}`;

export function getEventCategory(event, meta) {
  if (meta?.category) {
    const found = EVENT_CATEGORIES.find((c) => c.id === meta.category);
    if (found) return found;
  }
  const inferred = inferEventCategory(event?.title ?? '');
  const map = {
    Birthday: 'birthday',
    Anniversary: 'anniversary',
    Meal: 'meal',
    Trip: 'trip',
    Gathering: 'gathering',
  };
  const id = map[inferred.label] ?? 'gathering';
  const preset = EVENT_CATEGORIES.find((c) => c.id === id);
  return { ...preset, label: inferred.label };
}

export function getEventDateTime(event) {
  if (!event?.date) return null;
  const d = new Date(event.date);
  if (Number.isNaN(d.getTime())) return null;
  if (event.startTime) {
    const [h, m] = event.startTime.split(':').map(Number);
    if (!Number.isNaN(h)) d.setHours(h, m || 0, 0, 0);
  }
  return d;
}

export function isEventPast(event) {
  const dt = getEventDateTime(event);
  if (!dt) return false;
  return dt.getTime() < Date.now();
}

export function isEventToday(event) {
  return event?.date ? isSameDay(event.date, new Date()) : false;
}

export function filterTodayEvents(events) {
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (events ?? []).filter((e) => {
    if (!e.date) return false;
    const d = new Date(e.date);
    return d >= today && d < tomorrow;
  });
}

export function filterUpcomingEvents(events) {
  const start = startOfToday();
  return [...(events ?? [])]
    .filter((e) => e.date && new Date(e.date) >= start && !isEventPast(e))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function filterPastEvents(events) {
  return [...(events ?? [])]
    .filter((e) => isEventPast(e))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function filterPendingRsvpEvents(events, userId) {
  return (events ?? []).filter((e) => {
    if (isEventPast(e)) return false;
    return getMyRsvpStatus(e, userId) === 'pending';
  });
}

export function searchAndFilterEvents(events, { query, category, status, hostId, userId }) {
  let list = [...(events ?? [])];
  const q = query?.trim().toLowerCase();

  if (q) {
    list = list.filter(
      (e) =>
        e.title?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q),
    );
  }

  if (category && category !== 'all') {
    list = list.filter((e) => getEventCategory(e).id === category);
  }

  if (status === 'upcoming') list = filterUpcomingEvents(list);
  else if (status === 'past') list = filterPastEvents(list);
  else if (status === 'today') list = filterTodayEvents(list);
  else if (status === 'pending_rsvp') list = filterPendingRsvpEvents(list, userId);

  if (hostId) {
    list = list.filter((e) => {
      const cb = e.createdBy?._id ?? e.createdBy;
      return String(cb) === String(hostId);
    });
  }

  return list.sort((a, b) => new Date(a.date ?? 0) - new Date(b.date ?? 0));
}

export function groupEventsByDate(events) {
  const groups = {};
  (events ?? []).forEach((e) => {
    const key = e.date ? new Date(e.date).toDateString() : 'No date';
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return Object.entries(groups).map(([date, items]) => ({ date, items }));
}

export function buildEventsByDayMap(events) {
  const map = {};
  (events ?? []).forEach((e) => {
    if (!e.date) return;
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!map[key]) map[key] = [];
    map[key].push(e);
  });
  return map;
}

export function buildEventInsights(events, members, userId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const eventsThisMonth = (events ?? []).filter(
    (e) => e.date && new Date(e.date) >= monthStart,
  ).length;

  let totalRsvp = 0;
  let responded = 0;
  (events ?? []).forEach((e) => {
    const p = getEventRsvpProgress(e);
    totalRsvp += p.total;
    responded += p.responded;
  });
  const avgRsvp = totalRsvp > 0 ? Math.round((responded / totalRsvp) * 100) : 0;

  const organizerCounts = {};
  (events ?? []).forEach((e) => {
    const id = String(e.createdBy?._id ?? e.createdBy ?? '');
    if (id) organizerCounts[id] = (organizerCounts[id] ?? 0) + 1;
  });
  let topId = null;
  let topCount = 0;
  Object.entries(organizerCounts).forEach(([id, count]) => {
    if (count > topCount) {
      topCount = count;
      topId = id;
    }
  });
  const topOrganizer = (members ?? []).find((m) => String(m._id) === topId);

  const upcomingBirthdays = (events ?? []).filter((e) =>
    inferEventCategory(e.title).label === 'Birthday' && !isEventPast(e),
  ).length;
  const upcomingAnniversaries = (events ?? []).filter((e) =>
    inferEventCategory(e.title).label === 'Anniversary' && !isEventPast(e),
  ).length;

  const pendingRsvps = filterPendingRsvpEvents(events, userId).length;
  const nextEvent = pickUpcomingEvents(events, 1)[0];

  return {
    eventsThisMonth,
    avgRsvp,
    mostActiveOrganizer: topOrganizer?.fullName ?? '—',
    mostActiveOrganizerAvatar: topOrganizer?.avatar,
    upcomingBirthdays,
    upcomingAnniversaries,
    pendingRsvps,
    nextEvent,
    nextCountdown: nextEvent ? getEventCountdown(nextEvent) : null,
  };
}

export function buildRsvpSummary(event) {
  const guests = event?.guests ?? [];
  const summary = { accepted: 0, maybe: 0, declined: 0, pending: 0 };
  guests.forEach((g) => {
    const s = g.status ?? 'pending';
    if (summary[s] !== undefined) summary[s] += 1;
    else summary.pending += 1;
  });
  return { ...summary, total: guests.length, progress: getEventRsvpProgress(event) };
}

export function getGuestDisplayName(guest) {
  const u = guest?.userId;
  if (u && typeof u === 'object') return u.fullName ?? 'Member';
  return 'Member';
}

export function getGuestAvatar(guest) {
  const u = guest?.userId;
  if (u && typeof u === 'object') return u.avatar;
  return null;
}

export async function loadEventMeta(eventId) {
  try {
    const raw = await AsyncStorage.getItem(META_KEY(eventId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveEventMeta(eventId, meta) {
  await AsyncStorage.setItem(META_KEY(eventId), JSON.stringify(meta));
}

export async function loadEventReminders(familyId) {
  try {
    const raw = await AsyncStorage.getItem(REMINDER_KEY(familyId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveEventReminders(familyId, reminders) {
  await AsyncStorage.setItem(REMINDER_KEY(familyId), JSON.stringify(reminders));
}

export async function loadEventAttachments(eventId) {
  try {
    const raw = await AsyncStorage.getItem(ATTACHMENT_KEY(eventId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveEventAttachments(eventId, attachments) {
  await AsyncStorage.setItem(ATTACHMENT_KEY(eventId), JSON.stringify(attachments));
}

export function buildEventHistory(events, memories) {
  return filterPastEvents(events).map((event) => {
    const rsvp = buildRsvpSummary(event);
    const linkedMemories = (memories ?? []).filter((m) => {
      const cap = (m.caption ?? '').toLowerCase();
      return cap.includes((event.title ?? '').toLowerCase().slice(0, 8));
    });
    return {
      id: String(event._id),
      event,
      attendance: rsvp.accepted,
      totalGuests: rsvp.total,
      memoriesCount: linkedMemories.length,
      category: getEventCategory(event),
    };
  });
}

export { getEventCountdown, getEventRsvpProgress, resolveEventCreatorName };
