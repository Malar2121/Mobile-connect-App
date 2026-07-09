import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../design-system';
import { PollOption } from './PollOption';
import { useTheme } from '../../hooks/useTheme';

function PollCardComponent({ poll, results, onVote, onClose, canManage, voting }) {
  const { colors, layout, radii } = useTheme();
  if (!poll) return null;

  const winning = results?.length
    ? [...results].sort((a, b) => b.availabilityScore - a.availabilityScore)[0]
    : null;

  return (
    <Card>
      <View style={styles.header}>
        <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 17 * layout.fontScale, flex: 1 }}>
          {poll.question}
        </Text>
        {poll.isClosed ? (
          <View style={[styles.badge, { backgroundColor: colors.surfaceSecondary, borderRadius: radii.full }]}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Closed</Text>
          </View>
        ) : null}
      </View>

      {poll.deadline ? (
        <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 4 }}>
          Deadline: {new Date(poll.deadline).toLocaleString()}
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

      {winning && poll.isClosed ? (
        <View style={[styles.winner, { backgroundColor: colors.success + '18', borderRadius: radii.lg }]}>
          <Text style={{ color: colors.success, fontFamily: 'Inter_600SemiBold' }}>
            Winning slot: {winning.label} ({winning.availabilityScore}% availability)
          </Text>
        </View>
      ) : null}

      {canManage && !poll.isClosed && onClose ? (
        <Text
          onPress={onClose}
          style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', marginTop: 14, fontSize: 14 }}
          accessibilityRole="button"
        >
          Close poll & pick winner
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
