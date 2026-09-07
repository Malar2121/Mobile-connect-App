const { computeSmartDate } = require('../../utils/smartDate');

const future = (days) => new Date(Date.now() + days * 86400000);
const past = (days) => new Date(Date.now() - days * 86400000);
const poll = (options) => ({ options: options.map((o, i) => ({ _id: `opt${i}`, ...o })) });
const votes = (vote, n = 1) => Array.from({ length: n }, (_, i) => ({ user: `u_${vote}_${i}`, vote }));

describe('Smart Date Suggestion (proposal Objective 2)', () => {
  describe('scoring', () => {
    it('weights a maybe as half a yes', () => {
      const { suggestion } = computeSmartDate(
        poll([{ dateTime: future(3), label: 'A', votes: [...votes('yes', 1), ...votes('maybe', 2)] }]),
        4,
      );
      // (1 + 2*0.5) / 4 === 50%
      expect(suggestion.availabilityScore).toBe(50);
    });

    it('scores against the whole family, not only those who replied', () => {
      const { suggestion } = computeSmartDate(
        poll([{ dateTime: future(3), label: 'A', votes: votes('yes', 2) }]),
        6,
      );
      expect(suggestion.availabilityScore).toBe(33);
      expect(suggestion.coverage).toBe(33);
    });

    it('reports full availability and unanimity when everyone says yes', () => {
      const { suggestion } = computeSmartDate(
        poll([{ dateTime: future(3), label: 'A', votes: votes('yes', 4) }]),
        4,
      );
      expect(suggestion.availabilityScore).toBe(100);
      expect(suggestion.unanimous).toBe(true);
      expect(suggestion.confidence).toBe('high');
    });
  });

  describe('ranking', () => {
    it('prefers an option nobody refused over a more popular one with a blocker', () => {
      const { suggestion } = computeSmartDate(
        poll([
          { dateTime: future(3), label: 'Popular', votes: [...votes('yes', 3), ...votes('no', 1)] },
          { dateTime: future(4), label: 'Clean', votes: votes('yes', 2) },
        ]),
        4,
      );
      expect(suggestion.label).toBe('Clean');
      expect(suggestion.blockers).toBe(0);
    });

    it('breaks an exact tie by choosing the earlier date and flags the tie', () => {
      const { suggestion } = computeSmartDate(
        poll([
          { dateTime: future(9), label: 'Later', votes: votes('yes', 2) },
          { dateTime: future(3), label: 'Sooner', votes: votes('yes', 2) },
        ]),
        4,
      );
      expect(suggestion.label).toBe('Sooner');
      expect(suggestion.tiedWith).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('does not invent a winner when nobody has voted', () => {
      const result = computeSmartDate(
        poll([
          { dateTime: future(5), label: 'B', votes: [] },
          { dateTime: future(2), label: 'A', votes: [] },
        ]),
        4,
      );
      expect(result.reason).toBe('no_responses_yet');
      expect(result.suggestion.confidence).toBe('none');
      expect(result.suggestion.label).toBe('A');
    });

    it('keeps confidence low when only one of five has replied', () => {
      const { suggestion } = computeSmartDate(
        poll([{ dateTime: future(3), label: 'A', votes: votes('yes', 1) }]),
        5,
      );
      expect(suggestion.confidence).toBe('low');
      expect(suggestion.availabilityScore).toBe(20);
    });

    it('never suggests a date that has already passed', () => {
      const { suggestion } = computeSmartDate(
        poll([
          { dateTime: past(2), label: 'Gone', votes: votes('yes', 4) },
          { dateTime: future(2), label: 'Ahead', votes: votes('yes', 1) },
        ]),
        4,
      );
      expect(suggestion.label).toBe('Ahead');
    });

    it('returns no suggestion when every option is in the past', () => {
      const result = computeSmartDate(poll([{ dateTime: past(1), label: 'Gone', votes: votes('yes', 3) }]), 3);
      expect(result.suggestion).toBeNull();
      expect(result.reason).toBe('all_options_past');
    });

    it('handles a poll with no options at all', () => {
      const result = computeSmartDate(poll([]), 3);
      expect(result.reason).toBe('no_options');
      expect(result.suggestion).toBeNull();
    });

    it('handles a family size of zero without dividing by zero', () => {
      const { suggestion } = computeSmartDate(
        poll([{ dateTime: future(2), label: 'A', votes: votes('yes', 1) }]),
        0,
      );
      expect(Number.isFinite(suggestion.availabilityScore)).toBe(true);
      expect(suggestion.availabilityScore).toBe(100);
    });
  });
});
