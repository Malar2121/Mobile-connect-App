import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { formatMemoryDate } from '../../utils/memoryHelpers';

function MemoryAnalyticsCardComponent({ analytics }) {
  const { colors, layout, radii } = useTheme();
  if (!analytics) return null;

  const metrics = [
    { label: 'Total', value: analytics.totalMemories },
    { label: 'Photos', value: analytics.totalPhotos },
    { label: 'Videos', value: analytics.totalVideos },
    { label: 'Albums', value: analytics.totalAlbums },
  ];

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl }]}>
      <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 17 * layout.fontScale }}>Archive analytics</Text>
      {analytics.mostActiveContributor ? (
        <View style={[styles.row, { backgroundColor: colors.primarySubtle, borderRadius: radii.lg }]}>
          <Avatar uri={analytics.mostActiveAvatar} name={analytics.mostActiveContributor} size={36} />
          <View style={{ marginLeft: 10 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Top contributor</Text>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }}>{analytics.mostActiveContributor}</Text>
          </View>
        </View>
      ) : null}
      <View style={styles.grid}>
        {metrics.map((m) => (
          <View key={m.label} style={[styles.metric, { backgroundColor: colors.surfaceSecondary, borderRadius: radii.md }]}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 20 }}>{m.value}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{m.label}</Text>
          </View>
        ))}
      </View>
      {analytics.oldestMemory ? (
        <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 12 }}>
          Oldest: {formatMemoryDate(analytics.oldestMemory.createdAt)}
        </Text>
      ) : null}
      <View style={[styles.chart, { marginTop: 12 }]}>
        {(analytics.weekCounts ?? []).map((v, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ width: '70%', height: Math.max(4, v * 12), backgroundColor: colors.primary, borderRadius: 4 }} />
          </View>
        ))}
      </View>
      <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 6, textAlign: 'center' }}>Uploads this week</Text>
    </View>
  );
}

export const MemoryAnalyticsCard = memo(MemoryAnalyticsCardComponent);

const styles = StyleSheet.create({
  wrap: { padding: 16, borderWidth: StyleSheet.hairlineWidth, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 10, marginTop: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metric: { flex: 1, minWidth: '22%', padding: 10, alignItems: 'center' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 48, gap: 4 },
});
