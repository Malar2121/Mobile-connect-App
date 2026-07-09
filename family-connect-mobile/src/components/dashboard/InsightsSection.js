import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Avatar, SectionTitle } from '../../design-system';
import { DashboardAnimatedNumber } from './DashboardAnimatedNumber';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

function InsightTile({ label, value, sub, colors, layout, radii, children }) {
  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radii.lg,
        },
      ]}
    >
      {children}
      <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Inter_500Medium' }}>
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text
          style={{
            color: colors.text,
            fontFamily: 'Inter_700Bold',
            fontSize: 16 * layout.fontScale,
            marginTop: 4,
          }}
          numberOfLines={1}
        >
          {value}
        </Text>
      ) : (
        <DashboardAnimatedNumber
          value={value}
          style={{
            color: colors.text,
            fontSize: 22 * layout.fontScale,
            marginTop: 4,
          }}
        />
      )}
      {sub ? (
        <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 2 }}>{sub}</Text>
      ) : null}
    </View>
  );
}

function WeeklyGraph({ days, colors, radii }) {
  return (
    <View
      style={[
        styles.graph,
        {
          backgroundColor: colors.surfaceSecondary,
          borderRadius: radii.lg,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 12, fontFamily: 'Inter_600SemiBold' }}>
        Weekly activity
      </Text>
      <View style={styles.bars}>
        {days.map((d) => (
          <View key={d.key} style={styles.barCol} accessibilityLabel={`${d.label}, ${d.count} activities`}>
            <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.barFill,
                  {
                    height: `${Math.max(8, d.pct * 100)}%`,
                    backgroundColor: d.isToday ? colors.primary : colors.primaryMuted,
                  },
                ]}
              />
            </View>
            <Text
              style={{
                color: d.isToday ? colors.primary : colors.textTertiary,
                fontSize: 10,
                marginTop: 6,
                fontFamily: d.isToday ? 'Inter_700Bold' : 'Inter_400Regular',
              }}
            >
              {d.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function InsightsSectionComponent({ insights, weeklyActivity }) {
  const { colors, layout, radii } = useTheme();
  const { horizontalPadding } = useResponsive();

  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(520).springify()}
      style={{ paddingHorizontal: horizontalPadding, marginBottom: layout.sectionGap }}
    >
      <SectionTitle title="Family insights" subtitle="Engagement from your real activity" />

      <View style={styles.grid}>
        <InsightTile
          label="Most active"
          value={insights.mostActiveMember}
          colors={colors}
          layout={layout}
          radii={radii}
        >
          <Avatar uri={insights.mostActiveAvatar} name={insights.mostActiveMember} size={32} />
        </InsightTile>
        <InsightTile
          label="Events this month"
          value={insights.eventsThisMonth}
          colors={colors}
          layout={layout}
          radii={radii}
        />
        <InsightTile
          label="Memories uploaded"
          value={insights.memoriesThisMonth}
          sub={`${insights.totalMemories} total`}
          colors={colors}
          layout={layout}
          radii={radii}
        />
        <InsightTile
          label="Messages this week"
          value={insights.messagesThisWeek}
          colors={colors}
          layout={layout}
          radii={radii}
        />
        <InsightTile
          label="RSVP participation"
          value={`${insights.participationPct}%`}
          sub="Across scheduled events"
          colors={colors}
          layout={layout}
          radii={radii}
        />
      </View>

      <WeeklyGraph days={weeklyActivity} colors={colors} radii={radii} />
    </Animated.View>
  );
}

export const InsightsSection = memo(InsightsSectionComponent);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  tile: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  graph: {
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 88,
  },
  barCol: { flex: 1, alignItems: 'center' },
  barTrack: {
    width: 8,
    height: 64,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 4 },
});
