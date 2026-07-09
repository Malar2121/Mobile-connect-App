import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

function AnalyticsCardComponent({ title, subtitle, metrics, highlightMember, highlightAvatar }) {
  const { colors, layout, radii, shadows, isDark } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        shadows.md,
        {
          borderRadius: radii.xl,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <LinearGradient
        colors={isDark ? ['rgba(79,86,217,0.2)', 'transparent'] : ['rgba(238,240,255,0.8)', 'transparent']}
        style={[StyleSheet.absoluteFill, { borderRadius: radii.xl }]}
      />
      <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 18 * layout.fontScale }}>{title}</Text>
      {subtitle ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale, marginTop: 4 }}>{subtitle}</Text>
      ) : null}

      {highlightMember ? (
        <View style={[styles.highlight, { backgroundColor: colors.primarySubtle, borderRadius: radii.lg }]}>
          <Avatar uri={highlightAvatar} name={highlightMember} size={40} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12 * layout.fontScale }}>Most active</Text>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 16 * layout.fontScale }}>
              {highlightMember}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.grid}>
        {(metrics ?? []).map((m) => (
          <View key={m.label} style={[styles.metric, { backgroundColor: colors.surfaceSecondary, borderRadius: radii.md }]}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 20 * layout.fontScale }}>{m.value}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11 * layout.fontScale, marginTop: 2 }}>{m.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export const AnalyticsCard = memo(AnalyticsCardComponent);

const styles = StyleSheet.create({
  wrap: { padding: 18, borderWidth: StyleSheet.hairlineWidth, marginBottom: 16 },
  highlight: { flexDirection: 'row', alignItems: 'center', padding: 12, marginTop: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  metric: { flex: 1, minWidth: '45%', padding: 12, alignItems: 'center' },
});
