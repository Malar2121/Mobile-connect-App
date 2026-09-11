
import { translate } from '../i18n';export function formatEventDateShort(dateVal, locale = 'en') {
  if (!dateVal) return translate('events.dateTbd');
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return translate('events.dateTbd');
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
  if (!cb) return translate('profile.family');
  const id = String(cb);
  const m = (members ?? []).find((u) => String(u._id) === id);
  return m?.fullName ?? translate('events.familyMember');
}
