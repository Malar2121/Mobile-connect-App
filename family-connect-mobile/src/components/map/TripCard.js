import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../design-system';
import { formatDistance } from '../../utils/mapModuleHelpers';
import { useTheme } from '../../hooks/useTheme';

function TripCardComponent({ trip, onPress }) {
  const { colors, layout, radii } = useTheme();
  if (!trip) return null;

  return (
    <Pressable onPress={() => onPress?.(trip)} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1, marginBottom: 10 }]}>
      <Card>
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: colors.primarySubtle, borderRadius: radii.md }]}>
            <Ionicons name="car" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 15 * layout.fontScale }}>
              {formatDistance(trip.distanceKm)} · {trip.durationMin ?? 0} min
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
              Avg {trip.avgSpeedKmh ?? 0} km/h · {new Date(trip.startedAt).toLocaleString()}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </View>
      </Card>
    </Pressable>
  );
}

export const TripCard = memo(TripCardComponent);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
