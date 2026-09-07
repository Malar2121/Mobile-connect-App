/**
 * Shared celebration date maths.
 *
 * Used by the celebration controller (to list upcoming occasions) and by the
 * reminder scheduler (to decide what to send today), so both agree exactly on
 * when a recurring occasion next falls.
 */

/** Midnight UTC for a date, so day comparisons never depend on clock time. */
function startOfUTCDay(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * The next occurrence of an annually recurring date, on or after `from`.
 *
 * 29 February is observed on 28 February in non-leap years — otherwise a
 * leap-day birthday would silently vanish from three years in four.
 */
function nextAnnualOccurrence(sourceDate, from = new Date()) {
  const src = new Date(sourceDate);
  if (Number.isNaN(src.getTime())) return null;

  const fromDay = startOfUTCDay(from);
  const month = src.getUTCMonth();
  const day = src.getUTCDate();

  const build = (year) => {
    const isLeapDay = month === 1 && day === 29;
    const leapYear = new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1;
    const observedDay = isLeapDay && !leapYear ? 28 : day;
    return new Date(Date.UTC(year, month, observedDay));
  };

  let occurrence = build(fromDay.getUTCFullYear());
  if (occurrence < fromDay) occurrence = build(fromDay.getUTCFullYear() + 1);
  return occurrence;
}

/** Next occurrence for either recurrence mode; null once a one-off has passed. */
function nextOccurrence({ date, recurrence }, from = new Date()) {
  if (recurrence === 'once') {
    const exact = startOfUTCDay(date);
    return exact >= startOfUTCDay(from) ? exact : null;
  }
  return nextAnnualOccurrence(date, from);
}

/** Whole days from `from` until `occurrence` (0 = today). */
function daysUntil(occurrence, from = new Date()) {
  if (!occurrence) return null;
  const ms = startOfUTCDay(occurrence) - startOfUTCDay(from);
  return Math.round(ms / 86400000);
}

/**
 * How many years the occasion has been running at `occurrence`
 * (e.g. a person's age, or "12th anniversary"). Null when the source year
 * carries no meaning.
 */
function yearsAt(sourceDate, occurrence) {
  if (!sourceDate || !occurrence) return null;
  const src = new Date(sourceDate);
  const years = occurrence.getUTCFullYear() - src.getUTCFullYear();
  return years >= 0 ? years : null;
}

/**
 * Birthday celebrations derived from family members' profiles.
 * These are virtual — never persisted — so they always reflect the member's
 * current dateOfBirth and cannot go stale.
 */
function birthdaysFromMembers(members, from = new Date()) {
  return (members ?? [])
    .filter((m) => m.dateOfBirth)
    .map((m) => {
      const occurrence = nextAnnualOccurrence(m.dateOfBirth, from);
      return {
        _id: `birthday_${m._id}`,
        virtual: true,
        type: 'birthday',
        title: `${m.fullName}'s birthday`,
        description: '',
        date: m.dateOfBirth,
        recurrence: 'annual',
        relatedMembers: [{ _id: m._id, fullName: m.fullName, avatar: m.avatar ?? null }],
        reminderDaysBefore: [1],
        nextOccurrence: occurrence,
        daysUntil: daysUntil(occurrence, from),
        turningAge: yearsAt(m.dateOfBirth, occurrence),
      };
    })
    .filter((c) => c.nextOccurrence);
}

/** Attach computed occurrence fields to a stored celebration document. */
function decorate(celebration, from = new Date()) {
  const plain = celebration.toObject ? celebration.toObject() : { ...celebration };
  const occurrence = nextOccurrence(plain, from);
  return {
    ...plain,
    virtual: false,
    nextOccurrence: occurrence,
    daysUntil: daysUntil(occurrence, from),
    yearsRunning: plain.recurrence === 'annual' ? yearsAt(plain.date, occurrence) : null,
  };
}

module.exports = {
  startOfUTCDay,
  nextAnnualOccurrence,
  nextOccurrence,
  daysUntil,
  yearsAt,
  birthdaysFromMembers,
  decorate,
};
