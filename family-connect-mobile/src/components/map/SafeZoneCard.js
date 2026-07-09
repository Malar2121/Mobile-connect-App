import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

function SafeZoneCardComponent({ zone, onPress, onDelete }) {
  const { colors, layout, radii } = useTheme();

  return (
    <Pressable onPress={() => onPress?.(zone)} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1, marginBottom: 10 }]}>
      <Card>
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: (zone.color ?? colors.primary) + '22', borderRadius: radii.md }]}>
            <Ionicons name={zone.icon ?? 'location'} size={20} color={zone.color ?? colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 16 * layout.fontScale }}>{zone.label}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
              {zone.radiusM ?? 200}m radius · {zone.notifyEnter !== false ? 'Enter alerts' : 'No enter'} · {zone.notifyExit !== false ? 'Exit alerts' : 'No exit'}
            </Text>
          </View>
          {onDelete ? (
            <Pressable onPress={() => onDelete(zone)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
            </Pressable>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

export const SafeZoneCard = memo(SafeZoneCardComponent);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
