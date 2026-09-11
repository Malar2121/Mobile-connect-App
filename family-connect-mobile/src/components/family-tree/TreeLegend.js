import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useI18n, translate } from '../../i18n';

const LEGEND = [
  { color: '#6366F1', get label() { return translate('tree.parent'); } },
  { color: '#EC4899', get label() { return translate('tree.spouse'); } },
  { color: '#10B981', get label() { return translate('auth.memberChild'); } },
  { color: '#F59E0B', get label() { return translate('tree.sibling'); } },
];

function TreeLegendComponent() {
  const { colors, layout, radii } = useTheme();

  const { t } = useI18n();

  return (
    <View
      style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg }]}
      accessibilityLabel={t('tree.legend')}
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
