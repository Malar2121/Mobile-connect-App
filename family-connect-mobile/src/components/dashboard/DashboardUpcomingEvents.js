import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { DashboardGlassCard } from './DashboardGlassCard';
import { DashboardEmptyIllustration } from './DashboardEmptyIllustration';
import { DashboardPressable } from './DashboardPressable';
import { useTheme } from '../../hooks/useTheme';
import {
  dashboardRadii,
  dashboardShadows,
  dashboardSpacing,
  dashboardTypography,
} from '../../constants/dashboardTheme';

function formatEventDate(dateVal) {
  if (!dateVal) return 'Date TBD';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return 'Date TBD';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDay = new Date(d);
  eventDay.setHours(0, 0, 0, 0);
  const diff = Math.round((eventDay - today) / (24 * 60 * 60 * 1000));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function eventEmoji(title = '') {
  const t = title.toLowerCase();
  if (t.includes('birthday')) return '🎂';
  if (t.includes('dinner') || t.includes('lunch')) return '🍽️';
  if (t.includes('trip') || t.includes('travel')) return '✈️';
  return '📅';
}

function EventRow({ event, isLast, colors, isDark }) {
  return (
    <View
      style={[
        styles.eventRow,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          paddingBottom: 16,
          marginBottom: 16,
        },
      ]}
    >
      <View style={[styles.eventIcon, { backgroundColor: isDark ? 'rgba(129,140,248,0.15)' : 'rgba(99,102,241,0.1)' }]}>
        <Text style={styles.emoji}>{eventEmoji(event.title)}</Text>
      </View>
      <View style={styles.eventBody}>
        <Text
          style={{
            color: colors.text,
            fontFamily: dashboardTypography.fontSemi,
            fontSize: 16,
          }}
          numberOfLines={1}
        >
          {event.title}
        </Text>
        <View style={styles.metaLine}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {formatEventDate(event.date)}
            {event.startTime ? ` · ${event.startTime}` : ''}
          </Text>
        </View>
        {event.location ? (
          <View style={styles.metaLine}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function DashboardUpcomingEvents({ events, onAddEvent, onViewAll }) {
  const { colors, isDark } = useTheme();

  return (
    <Animated.View entering={FadeInDown.delay(160).duration(520).springify()} style={styles.section}>
      <View style={styles.head}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: dashboardTypography.fontSemi }]}>
          Upcoming events
        </Text>
        {events.length > 0 ? (
          <DashboardPressable onPress={onViewAll}>
            <Text style={{ color: colors.primary, fontFamily: dashboardTypography.fontMedium, fontSize: 14 }}>
              See all
            </Text>
          </DashboardPressable>
        ) : null}
      </View>

      <View style={styles.cardWrap}>
        <DashboardGlassCard>
          {events.length === 0 ? (
            <DashboardEmptyIllustration
              compact
              icon="calendar-outline"
              title="Nothing planned yet"
              message="Tap + to schedule your next family moment together."
            />
          ) : (
            events.map((ev, idx) => (
              <EventRow
                key={String(ev._id)}
                event={ev}
                isLast={idx === events.length - 1}
                colors={colors}
                isDark={isDark}
              />
            ))
          )}
        </DashboardGlassCard>

        <DashboardPressable onPress={onAddEvent} style={styles.fab}>
          <View style={[styles.fabInner, dashboardShadows.fab, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={28} color="#fff" />
          </View>
        </DashboardPressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: dashboardSpacing.md,
    paddingHorizontal: dashboardSpacing.screen,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: dashboardSpacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  cardWrap: {
    position: 'relative',
  },
  eventRow: {
    flexDirection: 'row',
    gap: 14,
  },
  eventIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  eventBody: {
    flex: 1,
    gap: 6,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: dashboardTypography.fontRegular,
    fontSize: 13,
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 12,
    bottom: -22,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: dashboardRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
