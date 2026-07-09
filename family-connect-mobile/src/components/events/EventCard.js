import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Badge } from '../../design-system';
import { CategoryChip } from './CategoryChip';
import { useTheme } from '../../hooks/useTheme';
import { formatEventDateShort, getMyRsvpStatus } from '../../utils/eventFormat';
import { getEventCategory, getEventCountdown } from '../../utils/eventModuleHelpers';

const RSVP_VARIANT = { accepted: 'success', maybe: 'warning', declined: 'danger', pending: 'default' };
const RSVP_LABEL = { accepted: 'Going', maybe: 'Maybe', declined: "Can't go", pending: 'No reply' };

function EventCardComponent({ event, userId, onPress, compact }) {
  const { colors, layout } = useTheme();
  const category = getEventCategory(event);
  const rsvp = getMyRsvpStatus(event, userId);
  const countdown = getEventCountdown(event);
  const timeSuffix = event.startTime ? ` · ${event.startTime}` : '';

  return (
    <Pressable onPress={() => onPress?.(event)} accessibilityRole="button">
      <Card
        style={[
          styles.card,
          { marginBottom: compact ? 8 : 12, borderLeftWidth: 4, borderLeftColor: category.color },
        ]}
      >
        <View style={styles.top}>
          <CategoryChip label={category.label} color={category.color} compact />
          <Badge label={RSVP_LABEL[rsvp]} variant={RSVP_VARIANT[rsvp]} />
        </View>
        <Text
          style={{
            color: colors.text,
            fontFamily: 'Inter_700Bold',
            fontSize: (compact ? 15 : 17) * layout.fontScale,
            marginTop: 8,
          }}
          numberOfLines={2}
        >
          {event.title}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginTop: 6 }}>
          {formatEventDateShort(event.date)}
          {timeSuffix}
        </Text>
        {event.location ? (
          <Text style={{ color: colors.textTertiary, fontSize: 13 * layout.fontScale, marginTop: 4 }} numberOfLines={1}>
            {event.location}
          </Text>
        ) : null}
        {countdown ? (
          <Text style={{ color: colors.primary, fontSize: 12 * layout.fontScale, marginTop: 6, fontFamily: 'Inter_600SemiBold' }}>
            {countdown}
          </Text>
        ) : null}
      </Card>
    </Pressable>
  );
}

export const EventCard = memo(EventCardComponent);

const styles = StyleSheet.create({
  card: {},
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
