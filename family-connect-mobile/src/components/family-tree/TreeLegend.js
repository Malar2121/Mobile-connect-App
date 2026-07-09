import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

const LEGEND = [
  { color: '#6366F1', label: 'Parent' },
  { color: '#EC4899', label: 'Spouse' },
  { color: '#10B981', label: 'Child' },
  { color: '#F59E0B', label: 'Sibling' },
];

function TreeLegendComponent() {
  const { colors, layout, radii } = useTheme();

  return (
    <View
      style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg }]}
      accessibilityLabel="Relationship legend"
    >
      {LEGEND.map((item) => (
        <View key={item.label} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <Text style={{ color: colors.textSecondary, fontSize: 11 * layout.fontScale }}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

export const TreeLegend = memo(TreeLegendComponent);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
