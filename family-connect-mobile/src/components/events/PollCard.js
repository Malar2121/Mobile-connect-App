import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../design-system';
import { PollOption } from './PollOption';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';

const REASON_TEXT = {
  no_responses_yet: 'No one has voted yet — this is just the earliest option.',
  works_for_everyone_who_replied: 'Works for everyone who has replied so far.',
  best_available_with_conflicts: 'Best available, but someone has said no to it.',
  all_options_past: 'Every proposed date has already passed.',
  no_options: 'This poll has no date options.',
};

const CONFIDENCE_TEXT = {
  high: 'Most of the family has replied.',
  medium: 'About half the family has replied.',
  low: 'Only a few people have replied so far.',
  none: 'Waiting on votes.',
};

function PollCardComponent({ poll, results, suggestion, suggestionReason, onVote, onClose, canManage, voting }) {
  const { t } = useI18n();
  const { colors, layout, radii } = useTheme();
  if (!poll) return null;

  // The server ranks options (fewest blockers, then availability, then
  // coverage, then earliest). Showing a locally re-sorted "winner" would
  // disagree with it, so the suggestion is taken as given.
  const winning = suggestion ?? null;

  return (
    <Card>
      <View style={styles.header}>
        <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 17 * layout.fontScale, flex: 1 }}>
          {poll.question}
        </Text>
        {poll.isClosed ? (
          <View style={[styles.badge, { backgroundColor: colors.surfaceSecondary, borderRadius: radii.full }]}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{t('events.closed')}</Text>
          </View>
        ) : null}
      </View>

      {poll.deadline ? (
        <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 4 }}>
          {t('events.deadlineValue', { date: new Date(poll.deadline).toLocaleString() })}
        </Text>
      ) : null}

      <View style={{ marginTop: 14, gap: 10 }}>
        {(poll.options ?? []).map((opt) => {
          const result = results?.find((r) => String(r.optionId) === String(opt._id));
          return (
            <PollOption
              key={String(opt._id)}
              option={opt}
              result={result}
              disabled={poll.isClosed || voting}
              onVote={(vote) => onVote?.(opt._id, vote)}
            />
          );
        })}
      </View>

      {winning ? (
        <View style={[styles.winner, { backgroundColor: colors.success + '18', borderRadius: radii.lg }]}>
          <Text style={{ color: colors.success, fontFamily: 'Inter_600SemiBold', fontSize: 14 * layout.fontScale }}>
            {poll.isClosed ? t('events.chosenSlot') : t('events.suggestedDate')}: {winning.label || new Date(winning.dateTime).toDateString()}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12.5 * layout.fontScale, marginTop: 4 }}>
            {t('events.familyAvailablePercent', { percent: winning.availabilityScore })}
            {winning.blockers > 0 ? t('events.blockersCanTMakeIt', { blockers: winning.blockers }) : ''}
          </Text>
          <Text style={{ color: colors.textTertiary, fontSize: 11.5 * layout.fontScale, marginTop: 3 }}>
            {REASON_TEXT[suggestionReason] ?? ''} {CONFIDENCE_TEXT[winning.confidence] ?? ''}
          </Text>
        </View>
      ) : null}

      {canManage && !poll.isClosed && onClose ? (
        <Text
          onPress={onClose}
          style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', marginTop: 14, fontSize: 14 }}
          accessibilityRole="button"
        >
          {t('events.closePollPickWinner')}
        </Text>
      ) : null}
    </Card>
  );
}

export const PollCard = memo(PollCardComponent);

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  badge: { paddingHorizontal: 8, paddingVertical: 4 },
  winner: { padding: 12, marginTop: 14 },
});
