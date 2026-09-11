import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EVENT_CATEGORIES } from '../../utils/eventModuleHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';

function CalendarLegendComponent() {
  const { t } = useI18n();
  const { colors, layout } = useTheme();

  return (
    <View style={styles.wrap}>
      <Text style={{ color: colors.textSecondary, fontSize: 12 * layout.fontScale, marginBottom: 8 }}>{t('events.categories')}</Text>
      <View style={styles.row}>
        {EVENT_CATEGORIES.map((c) => (
          <View key={c.id} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: c.color }]} />
            <Text style={{ color: colors.text, fontSize: 11 * layout.fontScale, marginLeft: 4 }}>{c.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export const CalendarLegend = memo(CalendarLegendComponent);

const styles = StyleSheet.create({
  wrap: { marginTop: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  item: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
