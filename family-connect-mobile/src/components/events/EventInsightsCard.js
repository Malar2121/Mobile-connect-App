import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

function EventInsightsCardComponent({ insights }) {
  const { colors, layout, radii } = useTheme();
  if (!insights) return null;

  const metrics = [
    { label: 'This month', value: insights.eventsThisMonth },
    { label: 'Avg RSVP', value: `${insights.avgRsvp}%` },
    { label: 'Pending RSVPs', value: insights.pendingRsvps },
    { label: 'Birthdays', value: insights.upcomingBirthdays },
    { label: 'Anniversaries', value: insights.upcomingAnniversaries },
  ];

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl }]}>
      <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 17 * layout.fontScale }}>Smart insights</Text>
      {insights.mostActiveOrganizer ? (
        <View style={[styles.organizer, { backgroundColor: colors.primarySubtle, borderRadius: radii.lg }]}>
          <Avatar uri={insights.mostActiveOrganizerAvatar} name={insights.mostActiveOrganizer} size={36} />
          <View style={{ marginLeft: 10 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Top organizer</Text>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }}>{insights.mostActiveOrganizer}</Text>
          </View>
        </View>
      ) : null}
      <View style={styles.grid}>
        {metrics.map((m) => (
          <View key={m.label} style={[styles.metric, { backgroundColor: colors.surfaceSecondary, borderRadius: radii.md }]}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 18 * layout.fontScale }}>{m.value}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 2 }}>{m.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export const EventInsightsCard = memo(EventInsightsCardComponent);

const styles = StyleSheet.create({
  wrap: { padding: 16, borderWidth: StyleSheet.hairlineWidth, marginBottom: 16 },
  organizer: { flexDirection: 'row', alignItems: 'center', padding: 10, marginTop: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metric: { flex: 1, minWidth: '30%', padding: 10, alignItems: 'center' },
});
