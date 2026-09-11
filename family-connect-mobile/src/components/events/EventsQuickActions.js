import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SectionTitle } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { useI18n, translate } from '../../i18n';

const ACTIONS = [
  { id: 'create', get label() { return translate('events.create2'); }, icon: 'add-circle-outline', screen: 'CreateEvent' },
  { id: 'calendar', get label() { return translate('events.calendar'); }, icon: 'calendar-outline', screen: 'Calendar' },
  { id: 'poll', get label() { return translate('events.poll'); }, icon: 'stats-chart-outline', screen: 'EventPoll', needsEvent: true },
  { id: 'celebrations', get label() { return translate('elder.celebrations'); }, icon: 'gift-outline', screen: 'Celebrations' },
  { id: 'reminders', get label() { return translate('events.reminders'); }, icon: 'alarm-outline', screen: 'EventReminders' },
  { id: 'history', get label() { return translate('events.history2'); }, icon: 'time-outline', screen: 'EventHistory' },
  { id: 'agenda', get label() { return translate('events.agenda'); }, icon: 'list-outline', screen: 'Agenda' },
];

function EventsQuickActionsComponent({ onNavigate, isMinor }) {
  const { colors, layout, radii } = useTheme();

  const { t } = useI18n();
  const visible = isMinor ? ACTIONS.filter((a) => !['create', 'poll'].includes(a.id)) : ACTIONS;

  return (
    <View style={{ marginBottom: layout.sectionGap }}>
      <SectionTitle title={t('common.quickActions')} />
      <View style={styles.grid}>
        {visible.map((action) => (
          <Pressable
            key={action.id}
            onPress={() => onNavigate?.(action.screen)}
            style={({ pressed }) => [
              styles.tile,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radii.xl,
                minHeight: layout.minTouch + 16,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Ionicons name={action.icon} size={22} color={colors.primary} />
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 12 * layout.fontScale, marginTop: 8 }}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export const EventsQuickActions = memo(EventsQuickActionsComponent);

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '31%',
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
