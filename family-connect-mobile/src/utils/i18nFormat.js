import { LOCALE_TAGS } from '../i18n/index';

const RELATIVE_MS = {
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
};

function resolveLocaleTag(locale) {
  return LOCALE_TAGS[locale] ?? 'en-US';
}

function getDateStrings(t) {
  return {
    today: t('dates.today'),
    yesterday: t('dates.yesterday'),
    tomorrow: t('dates.tomorrow'),
    justNow: t('dates.justNow'),
  };
}

export function formatDate(value, locale, options = {}) {
  if (!value) return options.fallback ?? '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return options.fallback ?? '—';
  return d.toLocaleDateString(resolveLocaleTag(locale), options);
}

export function formatTime(value, locale, options = {}) {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString(resolveLocaleTag(locale), {
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  });
}

export function formatDateTime(value, locale, options = {}) {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(resolveLocaleTag(locale), options);
}

export function formatNumber(value, locale, options = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString(resolveLocaleTag(locale), options);
}

export function formatRelativeDate(value, locale, t) {
  if (!value || !t) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const labels = getDateStrings(t);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round((startOfTarget - startOfToday) / RELATIVE_MS.day);

  if (dayDiff === 0) return labels.today;
  if (dayDiff === -1) return labels.yesterday;
  if (dayDiff === 1) return labels.tomorrow;

  const diffMs = now - d;
  if (diffMs >= 0 && diffMs < RELATIVE_MS.minute) return labels.justNow;
  if (diffMs >= 0 && diffMs < RELATIVE_MS.hour) {
    const mins = Math.max(1, Math.floor(diffMs / RELATIVE_MS.minute));
    return t('dates.minutesAgo', { count: mins });
  }
  if (diffMs >= 0 && diffMs < RELATIVE_MS.day) {
    const hrs = Math.max(1, Math.floor(diffMs / RELATIVE_MS.hour));
    return t('dates.hoursAgo', { count: hrs });
  }
  if (diffMs >= 0 && diffMs < RELATIVE_MS.day * 7) {
    const days = Math.max(1, Math.floor(diffMs / RELATIVE_MS.day));
    return t('dates.daysAgo', { count: days });
  }

  return formatDate(d, locale, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatEventDateShort(value, locale, t) {
  if (!value) return t?.('events.dateTbd') ?? 'Date TBD';
  return formatDate(value, locale, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatEventDateLong(value, locale) {
  return formatDate(value, locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getCalendarWeekdayLabels(locale, t) {
  if (t) {
    return [
      t('calendar.sun'),
      t('calendar.mon'),
      t('calendar.tue'),
      t('calendar.wed'),
      t('calendar.thu'),
      t('calendar.fri'),
      t('calendar.sat'),
    ];
  }
  const tag = resolveLocaleTag(locale);
  const base = new Date(2024, 0, 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d.toLocaleDateString(tag, { weekday: 'narrow' });
  });
}
