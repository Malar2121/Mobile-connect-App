import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';

function TravelStatsCardComponent({ analytics }) {
  const { colors, layout, radii, isDark } = useTheme();
  if (!analytics) return null;

  const stats = [
    { label: 'Distance today', value: `${analytics.distanceTodayKm} km` },
    { label: 'Trips', value: analytics.tripsToday },
    { label: 'Places', value: analytics.visitedPlaces },
    { label: 'Travel time', value: `${analytics.travelTimeMin}m` },
  ];

  return (
    <LinearGradient
      colors={isDark ? ['#1E1B2E', '#2A2640'] : ['#ECFDF5', '#EEF2FF']}
      style={[styles.wrap, { borderRadius: radii['2xl'], borderColor: colors.border }]}
    >
      <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 17 * layout.fontScale, marginBottom: 12 }}>Travel analytics</Text>
      <View style={styles.grid}>
        {stats.map((s) => (
          <View key={s.label} style={[styles.stat, { backgroundColor: colors.surface + (isDark ? 'CC' : '99'), borderRadius: radii.lg }]}>
            <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 20 * layout.fontScale }}>{s.value}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{s.label}</Text>
          </View>
        ))}
      </View>
      <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 12 }}>Most visited: {analytics.mostVisited}</Text>
    </LinearGradient>
  );
}

export const TravelStatsCard = memo(TravelStatsCardComponent);

const styles = StyleSheet.create({
  wrap: { padding: 18, borderWidth: StyleSheet.hairlineWidth, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { width: '47%', padding: 12 },
});
