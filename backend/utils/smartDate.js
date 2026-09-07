/**
 * Smart Date Suggestion.
 *
 * The proposal asks for an algorithm that finds "the best date for everyone"
 * from the family's availability poll. Picking the option with the most yes
 * votes is not enough on its own: an option two people love and three have not
 * answered is weaker evidence than one four people accepted, and a slot someone
 * has explicitly refused is not "best for everyone" however popular it is.
 *
 * Each option is scored on three things, then ranked:
 *
 *   availability — yes counts 1, maybe counts 0.5, no counts 0, over the
 *                  family size. This is the headline number.
 *   coverage     — how much of the family actually replied about this option.
 *                  A high score from two replies is held back by low coverage.
 *   blockers     — members who said no. Any option with zero blockers is
 *                  preferred over any option that has one, because the point
 *                  is a date that works for everyone.
 *
 * Ranking is: fewest blockers, then highest availability, then highest
 * coverage, then earliest date. Past options are never suggested.
 */

const WEIGHT = { yes: 1, maybe: 0.5, no: 0 };

function scoreOption(option, familySize, now) {
  const votes = option.votes ?? [];
  const counts = { yes: 0, maybe: 0, no: 0 };
  votes.forEach((v) => {
    if (counts[v.vote] !== undefined) counts[v.vote] += 1;
  });

  const responded = votes.length;
  const denominator = Math.max(familySize, responded, 1);
  const weighted = counts.yes * WEIGHT.yes + counts.maybe * WEIGHT.maybe;

  return {
    optionId: option._id,
    dateTime: option.dateTime,
    label: option.label,
    votes: { ...counts, total: responded },
    // Percentage of the whole family that can make it.
    availabilityScore: Math.round((weighted / denominator) * 100),
    // Percentage of the family that expressed any opinion.
    coverage: Math.round((responded / denominator) * 100),
    blockers: counts.no,
    isPast: new Date(option.dateTime) < now,
  };
}

/**
 * @param poll     an EventPoll document
 * @param familySize number of members who could vote
 * @returns {{results: Array, suggestion: object|null}}
 */
function computeSmartDate(poll, familySize, now = new Date()) {
  const results = (poll.options ?? []).map((o) => scoreOption(o, familySize, now));

  const candidates = results.filter((r) => !r.isPast);

  if (candidates.length === 0) {
    return {
      results,
      suggestion: null,
      reason: results.length === 0 ? 'no_options' : 'all_options_past',
    };
  }

  const anyVotes = candidates.some((r) => r.votes.total > 0);
  if (!anyVotes) {
    // Nobody has voted yet: recommending a "best" date would be inventing a
    // result. Say so, and point at the earliest option as a neutral default.
    const earliest = [...candidates].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))[0];
    return {
      results,
      suggestion: { ...earliest, confidence: 'none' },
      reason: 'no_responses_yet',
    };
  }

  const ranked = [...candidates].sort((a, b) => {
    if (a.blockers !== b.blockers) return a.blockers - b.blockers;
    if (b.availabilityScore !== a.availabilityScore) return b.availabilityScore - a.availabilityScore;
    if (b.coverage !== a.coverage) return b.coverage - a.coverage;
    return new Date(a.dateTime) - new Date(b.dateTime);
  });

  const best = ranked[0];
  const runnerUp = ranked[1] ?? null;

  // Confidence reflects how much of the family actually weighed in and whether
  // the winner is clearly ahead — so the UI can avoid overstating a thin result.
  let confidence = 'low';
  if (best.coverage >= 75 && best.blockers === 0) confidence = 'high';
  else if (best.coverage >= 50) confidence = 'medium';

  const isTie =
    !!runnerUp &&
    runnerUp.blockers === best.blockers &&
    runnerUp.availabilityScore === best.availabilityScore;

  return {
    results,
    suggestion: {
      ...best,
      confidence,
      unanimous: best.availabilityScore === 100,
      tiedWith: isTie ? runnerUp.optionId : null,
    },
    reason: best.blockers === 0 ? 'works_for_everyone_who_replied' : 'best_available_with_conflicts',
  };
}

module.exports = { computeSmartDate, scoreOption };
