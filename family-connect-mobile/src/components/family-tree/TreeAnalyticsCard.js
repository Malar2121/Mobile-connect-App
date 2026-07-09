import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

function TreeAnalyticsCardComponent({ analytics }) {
  const { colors, layout, radii, gradients, isDark } = useTheme();
  if (!analytics) return null;

  const stats = [
    { label: 'Generations', value: analytics.generationCount },
    { label: 'Members', value: analytics.memberCount },
    { label: 'Relationships', value: analytics.relationshipCount },
    { label: 'Legacy', value: analytics.legacyProfileCount },
  ];

  return (
    <LinearGradient
      colors={isDark ? ['#1E1B2E', '#2A2640'] : (gradients.mint ?? ['#ECFDF5', '#F0FDFA'])}
      style={[styles.wrap, { borderRadius: radii['2xl'], borderColor: colors.border }]}
    >
      <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 17 * layout.fontScale, marginBottom: 12 }}>
        Tree analytics
      </Text>
      <View style={styles.grid}>
        {stats.map((s) => (
          <View key={s.label} style={[styles.stat, { backgroundColor: colors.surface + (isDark ? 'CC' : '99'), borderRadius: radii.lg }]}>
            <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 22 * layout.fontScale }}>{s.value}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 * layout.fontScale }}>{s.label}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Avatar uri={analytics.mostConnectedAvatar} name={analytics.mostConnectedMember} size={36} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Most connected</Text>
          <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14 * layout.fontScale }}>
            {analytics.mostConnectedMember}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Completeness</Text>
          <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 18 * layout.fontScale }}>
            {analytics.treeCompleteness}%
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

export const TreeAnalyticsCard = memo(TreeAnalyticsCardComponent);

const styles = StyleSheet.create({
  wrap: { padding: 18, borderWidth: StyleSheet.hairlineWidth, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { width: '47%', padding: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
});
