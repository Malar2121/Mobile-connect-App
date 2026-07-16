import React, { memo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Badge, SectionTitle } from '../../design-system';
import { DashboardPressable } from './DashboardPressable';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';
import {
  inferEventCategory,
  getEventCountdown,
  getEventRsvpProgress,
} from '../../utils/dashboardHelpers';
import { formatEventDateShort } from '../../utils/eventFormat';
import { useI18n } from '../../i18n';

function EventCard({ event, index, onPress, colors, layout, radii, gradients, isDark }) {
  const category = inferEventCategory(event.title);
  const countdown = getEventCountdown(event);
  const rsvp = getEventRsvpProgress(event);
  const gradient = gradients[category.color] ?? gradients.cool;

  return (
    <Animated.View entering={FadeInRight.delay(index * 60).duration(420).springify()}>
      <DashboardPressable onPress={() => onPress?.(event)} accessibilityLabel={`Event ${event.title}`}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
              borderColor: colors.border,
              borderRadius: radii.xl,
              width: 280,
            },
          ]}
        >
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.accentBar, { borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl }]}
          />
          <View style={styles.cardBody}>
            <View style={styles.topRow}>
              <Badge label={category.label} variant="primary" size="sm" />
              {countdown ? (
                <Text style={{ color: colors.primary, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
                  {countdown}
                </Text>
              ) : null}
            </View>
            <Text
              style={{
                color: colors.text,
                fontSize: 17 * layout.fontScale,
                fontFamily: 'Inter_700Bold',
                marginTop: 10,
              }}
              numberOfLines={2}
            >
              {event.title}
            </Text>
            <View style={styles.meta}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 6 }}>
                {formatEventDateShort(event.date)}
                {event.startTime ? ` · ${event.startTime}` : ''}
              </Text>
            </View>
            {event.location ? (
              <View style={styles.meta}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 6 }} numberOfLines={1}>
                  {event.location}
                </Text>
              </View>
            ) : null}
            {rsvp.total > 0 ? (
              <View style={styles.rsvpRow}>
                <View style={[styles.rsvpTrack, { backgroundColor: colors.surfaceSecondary }]}>
                  <View
                    style={[
                      styles.rsvpFill,
                      { width: `${rsvp.pct}%`, backgroundColor: colors.primary },
                    ]}
                  />
                </View>
                <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 4 }}>
                  RSVP {rsvp.responded}/{rsvp.total}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </DashboardPressable>
    </Animated.View>
  );
}

function UpcomingEventsSectionComponent({ events, onEventPress, onViewAll, onAddEvent }) {
  const { colors, layout, radii, gradients, isDark } = useTheme();
  const { horizontalPadding } = useResponsive();
  const { t } = useI18n();

  return (
    <View style={{ marginBottom: layout.sectionGap }}>
      <View style={{ paddingHorizontal: horizontalPadding }}>
        <SectionTitle
          title={t('dashboard.upcomingEvents')}
          subtitle={events.length ? t('dashboard.onCalendar', { count: events.length }) : t('dashboard.nothingScheduled')}
          actionLabel={events.length ? t('common.viewAll') : undefined}
          onAction={events.length ? onViewAll : undefined}
        />
      </View>

      {events.length === 0 ? (
        <View style={{ paddingHorizontal: horizontalPadding }}>
          <DashboardPressable onPress={onAddEvent}>
            <View
              style={[
                styles.empty,
                {
                  borderColor: colors.border,
                  borderRadius: radii.xl,
                  backgroundColor: colors.primarySubtle,
                },
              ]}
            >
              <Ionicons name="calendar-outline" size={32} color={colors.primary} />
              <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', marginTop: 10 }}>
                {t('dashboard.planGathering')}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                {t('dashboard.tapCreateEvent')}
              </Text>
            </View>
          </DashboardPressable>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingHorizontal: horizontalPadding }]}
        >
          {events.map((event, index) => (
            <EventCard
              key={String(event._id)}
              event={event}
              index={index}
              onPress={onEventPress}
              colors={colors}
              layout={layout}
              radii={radii}
              gradients={gradients}
              isDark={isDark}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export const UpcomingEventsSection = memo(UpcomingEventsSectionComponent);

const styles = StyleSheet.create({
  scroll: { gap: 14, paddingBottom: 4 },
  card: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  accentBar: { height: 4 },
  cardBody: { padding: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  rsvpRow: { marginTop: 12 },
  rsvpTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  rsvpFill: { height: '100%', borderRadius: 2 },
  empty: {
    alignItems: 'center',
    padding: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
  },
});
