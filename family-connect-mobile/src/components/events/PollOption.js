import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';

function PollOptionComponent({ option, result, onVote, disabled, busy, userId }) {
  const { t } = useI18n();
  const { colors, layout, radii } = useTheme();
  const score = result?.availabilityScore ?? 0;
  const votes = result?.votes ?? { yes: 0, maybe: 0, no: 0, total: 0 };
  // vote.user is populated ({ _id, fullName }) by the poll API, or a plain id.
  const myVote = userId
    ? (option.votes ?? []).find((v) => String(v.user?._id ?? v.user) === String(userId))?.vote
    : null;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceSecondary, borderRadius: radii.lg, borderColor: colors.border }]}>
      <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 15 * layout.fontScale }}>
        {option.label}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
        {new Date(option.dateTime).toLocaleString()}
      </Text>

      <View style={[styles.bar, { backgroundColor: colors.border, borderRadius: radii.full, marginTop: 10 }]}>
        <View style={[styles.fill, { width: `${score}%`, backgroundColor: colors.primary, borderRadius: radii.full }]} />
      </View>
      <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 4 }}>
        {t('events.voteSummary', { yes: votes.yes, maybe: votes.maybe, no: votes.no, score })}
      </Text>

      {!disabled ? (
        <View style={styles.voteRow}>
          {['yes', 'maybe', 'no'].map((v) => {
            const selected = myVote === v;
            return (
              <Pressable
                key={v}
                onPress={() => {
                  if (!selected) onVote?.(v); // same answer again: nothing to change
                }}
                disabled={Boolean(busy)}
                style={[
                  styles.voteBtn,
                  {
                    backgroundColor: selected ? colors.primary : colors.primarySubtle,
                    borderRadius: radii.md,
                    minHeight: layout.minTouch,
                    opacity: busy ? 0.5 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('events.voteV', { v })}
                accessibilityState={{ selected, disabled: Boolean(busy) }}
              >
                {selected ? <Ionicons name="checkmark" size={16} color={colors.textInverse} style={styles.check} /> : null}
                <Text
                  style={{
                    color: selected ? colors.textInverse : colors.primary,
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 13,
                    textTransform: 'capitalize',
                  }}
                >
                  {v}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export const PollOption = memo(PollOptionComponent);

const styles = StyleSheet.create({
  wrap: { padding: 14, borderWidth: StyleSheet.hairlineWidth },
  bar: { height: 6, overflow: 'hidden' },
  fill: { height: 6 },
  voteRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  voteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  check: { marginRight: 4 },
});
