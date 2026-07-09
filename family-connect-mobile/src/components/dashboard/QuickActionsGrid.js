import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SectionTitle } from '../../design-system';
import { DashboardPressable } from './DashboardPressable';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

const ALL_ACTIONS = [
  {
    id: 'event',
    title: 'Create Event',
    subtitle: 'Plan together',
    icon: 'calendar',
    gradientKey: 'cool',
    route: 'Events',
    screen: 'CreateEvent',
    minorHidden: true,
  },
  {
    id: 'memory',
    title: 'Upload Memory',
    subtitle: 'Share a moment',
    icon: 'cloud-upload',
    gradientKey: 'warm',
    route: 'Memories',
    screen: 'UploadMemory',
    minorHidden: true,
  },
  {
    id: 'chat',
    title: 'Open Chat',
    subtitle: 'Message family',
    icon: 'chatbubbles',
    gradientKey: 'mint',
    route: 'Chat',
  },
  {
    id: 'map',
    title: 'Open Map',
    subtitle: 'See everyone',
    icon: 'map',
    gradientKey: 'sunset',
    route: 'Map',
  },
  {
    id: 'invite',
    title: 'Invite Member',
    subtitle: 'Grow your circle',
    icon: 'person-add',
    gradientKey: 'primary',
    action: 'invite',
    minorHidden: true,
  },
  {
    id: 'gallery',
    title: 'Create Album',
    subtitle: 'Browse memories',
    icon: 'albums',
    gradientKey: 'cardAccent',
    route: 'Memories',
    screen: 'MemoriesHome',
  },
  {
    id: 'poll',
    title: 'Create Poll',
    subtitle: 'Pick a date',
    icon: 'bar-chart',
    gradientKey: 'cool',
    route: 'Events',
    screen: 'EventsHome',
    minorHidden: true,
  },
  {
    id: 'tree',
    title: 'Family Tree',
    subtitle: 'View connections',
    icon: 'git-network',
    gradientKey: 'mint',
    route: 'Profile',
    screen: 'FamilyTreeModule',
    nestedScreen: 'FamilyTreeHome',
  },
];

function ActionTile({ item, index, onPress, colors, gradients, layout, radii, tileWidth }) {
  const gradient = gradients[item.gradientKey] ?? gradients.cool;

  return (
    <Animated.View
      entering={FadeInDown.delay(80 + index * 40).duration(420).springify()}
      style={{ width: tileWidth }}
    >
      <DashboardPressable onPress={() => onPress(item)} accessibilityLabel={item.title}>
        <LinearGradient
          colors={
            colors.isDark
              ? ['rgba(79,86,217,0.2)', 'rgba(20,20,28,0.9)']
              : ['rgba(238,240,255,0.95)', 'rgba(255,255,255,0.98)']
          }
          style={[
            styles.tile,
            {
              borderColor: colors.border,
              borderRadius: radii.xl,
              minHeight: layout.minTouch + 36,
            },
          ]}
        >
          <LinearGradient
            colors={gradient}
            style={[styles.iconBox, { borderRadius: radii.md }]}
          >
            <Ionicons name={`${item.icon}-outline`} size={22} color="#fff" />
          </LinearGradient>
          <Text
            style={{
              color: colors.text,
              fontFamily: 'Inter_700Bold',
              fontSize: 15 * layout.fontScale,
              marginTop: 12,
            }}
          >
            {item.title}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 12 * layout.fontScale,
              marginTop: 2,
            }}
          >
            {item.subtitle}
          </Text>
        </LinearGradient>
      </DashboardPressable>
    </Animated.View>
  );
}

function QuickActionsGridComponent({ isMinor, onAction }) {
  const theme = useTheme();
  const { colors, layout, radii, gradients, isDark } = theme;
  const { horizontalPadding, isTablet } = useResponsive();
  const { width } = useWindowDimensions();

  const actions = useMemo(
    () => ALL_ACTIONS.filter((a) => !(isMinor && a.minorHidden)),
    [isMinor],
  );

  const gap = 12;
  const columns = isTablet ? 3 : 2;
  const tileWidth = (width - horizontalPadding * 2 - gap * (columns - 1)) / columns;

  const themeColors = { ...colors, isDark };

  return (
    <View style={{ paddingHorizontal: horizontalPadding, marginBottom: layout.sectionGap }}>
      <SectionTitle title="Quick actions" subtitle="Jump into what matters" />
      <View style={[styles.grid, { gap }]}>
        {actions.map((item, index) => (
          <ActionTile
            key={item.id}
            item={item}
            index={index}
            onPress={onAction}
            colors={themeColors}
            gradients={gradients}
            layout={layout}
            radii={radii}
            tileWidth={tileWidth}
          />
        ))}
      </View>
    </View>
  );
}

export const QuickActionsGrid = memo(QuickActionsGridComponent);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tile: {
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
