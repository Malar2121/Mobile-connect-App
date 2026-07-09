export function formatEventDateShort(dateVal, locale = 'en') {
  if (!dateVal) return 'Date TBD';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return 'Date TBD';
  const tag = locale === 'ta' ? 'ta-LK' : locale === 'si' ? 'si-LK' : 'en-US';
  return d.toLocaleDateString(tag, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatEventDateLong(dateVal, locale = 'en') {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return '—';
  const tag = locale === 'ta' ? 'ta-LK' : locale === 'si' ? 'si-LK' : 'en-US';
  return d.toLocaleDateString(tag, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function guestEntryUserId(guest) {
  if (!guest?.userId) return '';
  const u = guest.userId;
  return String(u._id ?? u);
}

export function getMyRsvpStatus(event, userId) {
  if (!userId || !event?.guests?.length) return 'pending';
  const uid = String(userId);
  const g = event.guests.find((guest) => guestEntryUserId(guest) === uid);
  return g?.status ?? 'pending';
}

export function resolveEventCreatorName(event, members) {
  const cb = event?.createdBy;
  if (cb && typeof cb === 'object' && cb.fullName) return cb.fullName;
  if (!cb) return 'Family';
  const id = String(cb);
  const m = (members ?? []).find((u) => String(u._id) === id);
  return m?.fullName ?? 'Family member';
}
