import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

function MemoryMapCardComponent({ memory, locationLabel, onPress }) {
  const { colors, layout, radii } = useTheme();

  return (
    <Pressable
      onPress={() => onPress?.(memory)}
      style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg }]}
    >
      <View style={[styles.icon, { backgroundColor: colors.primarySubtle, borderRadius: radii.md }]}>
        <Ionicons name="location" size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }} numberOfLines={1}>
          {memory.caption || 'Memory'}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{locationLabel || 'Location'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

export const MemoryMapCard = memo(MemoryMapCardComponent);

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: StyleSheet.hairlineWidth, marginBottom: 8 },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
