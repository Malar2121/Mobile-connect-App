import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

function PollOptionComponent({ option, result, onVote, disabled }) {
  const { colors, layout, radii } = useTheme();
  const score = result?.availabilityScore ?? 0;
  const votes = result?.votes ?? { yes: 0, maybe: 0, no: 0, total: 0 };

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
        {votes.yes} yes · {votes.maybe} maybe · {votes.no} no · {score}% score
      </Text>

      {!disabled ? (
        <View style={styles.voteRow}>
          {['yes', 'maybe', 'no'].map((v) => (
            <Pressable
              key={v}
              onPress={() => onVote?.(v)}
              style={[styles.voteBtn, { backgroundColor: colors.primarySubtle, borderRadius: radii.md, minHeight: layout.minTouch }]}
              accessibilityLabel={`Vote ${v}`}
            >
              <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 13, textTransform: 'capitalize' }}>
                {v}
              </Text>
            </Pressable>
          ))}
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
  voteBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
});
