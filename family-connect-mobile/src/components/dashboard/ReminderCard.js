import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SectionTitle } from '../../design-system';
import { DashboardPressable } from './DashboardPressable';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

const PRIORITY_COLORS = {
  high: ['#FF6B4A', '#F59E0B'],
  medium: ['#4F56D9', '#6B72F0'],
  normal: ['#10B981', '#2DD4BF'],
};

function ReminderCardComponent({ reminders, onPressReminder, onViewAll }) {
  const { colors, layout, radii, isDark } = useTheme();
  const { horizontalPadding } = useResponsive();
  const primary = reminders[0];

  if (!primary) {
    return (
      <View style={{ paddingHorizontal: horizontalPadding, marginBottom: layout.sectionGap }}>
        <SectionTitle title="Today's reminder" />
        <View
          style={[
            styles.empty,
            {
              backgroundColor: colors.surfaceSecondary,
              borderRadius: radii.xl,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="sunny-outline" size={28} color={colors.textTertiary} />
          <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 14 * layout.fontScale }}>
            No reminders for today — enjoy the calm.
          </Text>
        </View>
      </View>
    );
  }

  const gradient = PRIORITY_COLORS[primary.priority] ?? PRIORITY_COLORS.normal;

  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(480).springify()}
      style={{ paddingHorizontal: horizontalPadding, marginBottom: layout.sectionGap }}
    >
      <SectionTitle
        title="Today's reminder"
        actionLabel={reminders.length > 1 ? 'See all' : undefined}
        onAction={reminders.length > 1 ? onViewAll : undefined}
      />
      <DashboardPressable onPress={() => onPressReminder?.(primary.event)}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, { borderRadius: radii['2xl'] }]}
        >
          <View style={styles.cardTop}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{primary.category}</Text>
            </View>
            {primary.countdown ? (
              <View style={styles.countdown}>
                <Ionicons name="time-outline" size={14} color="#fff" />
                <Text style={styles.countdownText}>{primary.countdown}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.title, { fontSize: 20 * layout.fontScale }]} numberOfLines={2}>
            {primary.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {primary.subtitle}
          </Text>
          <Text style={styles.time}>{primary.timeLabel}</Text>
        </LinearGradient>
      </DashboardPressable>
    </Animated.View>
  );
}

export const ReminderCard = memo(ReminderCardComponent);

const styles = StyleSheet.create({
  card: { padding: 20 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  countdown: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countdownText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  title: { color: '#fff', fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  subtitle: { color: 'rgba(255,255,255,0.88)', fontSize: 14, marginTop: 6 },
  time: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 10, fontFamily: 'Inter_500Medium' },
  empty: {
    alignItems: 'center',
    padding: 24,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
