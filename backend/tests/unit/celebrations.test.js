const {
  nextAnnualOccurrence,
  nextOccurrence,
  daysUntil,
  yearsAt,
  birthdaysFromMembers,
} = require('../../utils/celebrations');

const utc = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
const iso = (d) => d.toISOString().slice(0, 10);

describe('Celebration date maths (proposal Objective 3)', () => {
  describe('nextAnnualOccurrence', () => {
    it('returns this year when the date is still ahead', () => {
      expect(iso(nextAnnualOccurrence(utc(1990, 6, 15), utc(2026, 1, 1)))).toBe('2026-06-15');
    });

    it('rolls to next year once the date has passed', () => {
      expect(iso(nextAnnualOccurrence(utc(1990, 1, 5), utc(2026, 6, 1)))).toBe('2027-01-05');
    });

    it('treats the occasion day itself as still upcoming', () => {
      expect(iso(nextAnnualOccurrence(utc(1990, 6, 15), utc(2026, 6, 15)))).toBe('2026-06-15');
    });

    it('observes 29 February on the 28th in a non-leap year', () => {
      expect(iso(nextAnnualOccurrence(utc(2000, 2, 29), utc(2027, 1, 1)))).toBe('2027-02-28');
    });

    it('keeps 29 February in a leap year', () => {
      expect(iso(nextAnnualOccurrence(utc(2000, 2, 29), utc(2028, 1, 1)))).toBe('2028-02-29');
    });

    it('returns null for an unparseable date rather than throwing', () => {
      expect(nextAnnualOccurrence('not-a-date')).toBeNull();
    });
  });

  describe('nextOccurrence for one-off occasions', () => {
    it('returns the date while it is still ahead', () => {
      const r = nextOccurrence({ date: utc(2026, 8, 1), recurrence: 'once' }, utc(2026, 7, 1));
      expect(iso(r)).toBe('2026-08-01');
    });

    it('returns null once a one-off has passed instead of repeating it', () => {
      const r = nextOccurrence({ date: utc(2026, 6, 1), recurrence: 'once' }, utc(2026, 7, 1));
      expect(r).toBeNull();
    });
  });

  describe('daysUntil', () => {
    it('counts whole days and treats today as zero', () => {
      expect(daysUntil(utc(2026, 6, 15), utc(2026, 6, 15))).toBe(0);
      expect(daysUntil(utc(2026, 6, 16), utc(2026, 6, 15))).toBe(1);
      expect(daysUntil(utc(2026, 7, 15), utc(2026, 6, 15))).toBe(30);
    });

    it('ignores the time of day, so an evening check still reads as today', () => {
      const morning = new Date(Date.UTC(2026, 5, 15, 8, 0));
      const evening = new Date(Date.UTC(2026, 5, 15, 23, 30));
      expect(daysUntil(morning, evening)).toBe(0);
    });
  });

  describe('yearsAt', () => {
    it('computes the age reached at the occurrence', () => {
      expect(yearsAt(utc(1990, 1, 5), utc(2027, 1, 5))).toBe(37);
    });

    it('returns null when the occurrence precedes the source date', () => {
      expect(yearsAt(utc(2030, 1, 5), utc(2027, 1, 5))).toBeNull();
    });
  });

  describe('birthdaysFromMembers', () => {
    it('derives a virtual birthday from a member profile', () => {
      const [b] = birthdaysFromMembers(
        [{ _id: 'u1', fullName: 'Amma', dateOfBirth: utc(1972, 4, 12) }],
        utc(2026, 4, 10),
      );
      expect(b.virtual).toBe(true);
      expect(b.type).toBe('birthday');
      expect(b.title).toBe("Amma's birthday");
      expect(b.daysUntil).toBe(2);
      expect(b.turningAge).toBe(54);
    });

    it('skips members with no date of birth rather than guessing', () => {
      const result = birthdaysFromMembers([{ _id: 'u1', fullName: 'No DOB', dateOfBirth: null }]);
      expect(result).toHaveLength(0);
    });

    it('returns an empty list for no members', () => {
      expect(birthdaysFromMembers([])).toEqual([]);
      expect(birthdaysFromMembers(undefined)).toEqual([]);
    });
  });
});
