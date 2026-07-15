import React, { memo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { SectionTitle } from '../../design-system';
import { DashboardAnimatedNumber } from './DashboardAnimatedNumber';
import { DashboardPressable } from './DashboardPressable';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

const SUMMARY_ITEMS = [
  { key: 'todayEvents', label: 'Events today', icon: 'calendar', gradientKey: 'cool' },
  { key: 'newMemories', label: 'New memories', icon: 'images', gradientKey: 'warm' },
  { key: 'unreadMessages', label: 'Unread chats', icon: 'chatbubbles', gradientKey: 'mint' },
  { key: 'unreadNotifications', label: 'Alerts', icon: 'notifications', gradientKey: 'sunset' },
  { key: 'activeMembers', label: 'Active now', icon: 'radio-button-on', gradientKey: 'primary' },
];

function SummaryTile({ item, value, index, onPress, colors, isDark, gradients, layout, radii }) {
  const gradient = gradients[item.gradientKey] ?? gradients.cool;

  return (
    <Animated.View entering={FadeInRight.delay(index * 50).duration(400).springify()}>
      <DashboardPressable onPress={onPress} accessibilityLabel={`${item.label}, ${value}`}>
        <View
          style={[
            styles.tile,
            {
              backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
              borderColor: colors.border,
              borderRadius: radii.xl,
              minWidth: layout.minTouch + 52,
            },
          ]}
        >
          <View style={[styles.iconRing, { backgroundColor: colors.primarySubtle }]}>
            <Ionicons name={`${item.icon}-outline`} size={18} color={colors.primary} />
          </View>
          <DashboardAnimatedNumber
            value={value}
            style={{
              color: colors.text,
              fontSize: 26 * layout.fontScale,
              marginTop: 10,
            }}
          />
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 12 * layout.fontScale,
              marginTop: 4,
              fontFamily: 'Inter_500Medium',
            }}
          >
            {item.label}
          </Text>
          <View style={[styles.accent, { borderRadius: radii.sm, overflow: 'hidden' }]}>
            <View style={{ height: 3, backgroundColor: gradient[0] }} />
          </View>
        </View>
      </DashboardPressable>
    </Animated.View>
  );
}

function TodaysSummaryComponent({ summary, onStatPress }) {
  const { colors, isDark, gradients, layout, radii } = useTheme();
  const { horizontalPadding } = useResponsive();

  return (
    <View style={{ marginBottom: layout.sectionGap }}>
      <View style={{ paddingHorizontal: horizontalPadding, marginBottom: 12 }}>
        <SectionTitle title="Today's summary" subtitle="Your family at a glance" />
      </View>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingHorizontal: horizontalPadding,
          gap: 12,
        }}
      >
        {SUMMARY_ITEMS.map((item, index) => (
          <View key={item.key} style={{ width: '47%', flexGrow: 1 }}>
            <SummaryTile
              item={item}
              value={summary[item.key] ?? 0}
              index={index}
              onPress={() => onStatPress?.(item.key)}
              colors={colors}
              isDark={isDark}
              gradients={gradients}
              layout={layout}
              radii={radii}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export const TodaysSummary = memo(TodaysSummaryComponent);

const styles = StyleSheet.create({
  scroll: { gap: 12, paddingBottom: 4 },
  tile: {
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  iconRing: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
