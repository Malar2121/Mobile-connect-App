import { useI18n } from '../i18n';
import {
  formatDate,
  formatDateTime,
  formatEventDateLong,
  formatEventDateShort,
  formatNumber,
  formatRelativeDate,
  formatTime,
  getCalendarWeekdayLabels,
} from '../utils/i18nFormat';

/** Locale-aware formatting bound to the active i18n locale. */
export function useFormat() {
  const { locale, t } = useI18n();

  return {
    locale,
    formatDate: (value, options) => formatDate(value, locale, options),
    formatTime: (value, options) => formatTime(value, locale, options),
    formatDateTime: (value, options) => formatDateTime(value, locale, options),
    formatNumber: (value, options) => formatNumber(value, locale, options),
    formatRelative: (value) => formatRelativeDate(value, locale, t),
    formatEventDateShort: (value) => formatEventDateShort(value, locale, t),
    formatEventDateLong: (value) => formatEventDateLong(value, locale),
    calendarWeekdays: () => getCalendarWeekdayLabels(locale, t),
  };
}
