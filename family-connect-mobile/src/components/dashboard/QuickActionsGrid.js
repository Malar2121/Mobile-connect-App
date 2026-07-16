import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SectionTitle } from '../../design-system';
import { DashboardPressable } from './DashboardPressable';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';
import { useI18n } from '../../i18n';

const ALL_ACTIONS = [
  {
    id: 'event',
    titleKey: 'dashboard.qaCreateEvent',
    subtitleKey: 'dashboard.qaCreateEventSub',
    icon: 'calendar',
    gradientKey: 'cool',
    route: 'Events',
    screen: 'CreateEvent',
    minorHidden: true,
  },
  {
    id: 'memory',
    titleKey: 'dashboard.qaUploadMemory',
    subtitleKey: 'dashboard.qaUploadMemorySub',
    icon: 'cloud-upload',
    gradientKey: 'warm',
    route: 'Memories',
    screen: 'UploadMemory',
    minorHidden: true,
  },
  {
    id: 'chat',
    titleKey: 'dashboard.qaOpenChat',
    subtitleKey: 'dashboard.qaOpenChatSub',
    icon: 'chatbubbles',
    gradientKey: 'mint',
    route: 'Chat',
  },
  {
    id: 'map',
    titleKey: 'dashboard.qaOpenMap',
    subtitleKey: 'dashboard.qaOpenMapSub',
    icon: 'map',
    gradientKey: 'sunset',
    route: 'Map',
  },
  {
    id: 'invite',
    titleKey: 'dashboard.qaInvite',
    subtitleKey: 'dashboard.qaInviteSub',
    icon: 'person-add',
    gradientKey: 'primary',
    action: 'invite',
    minorHidden: true,
  },
  {
    id: 'gallery',
    titleKey: 'dashboard.qaAlbum',
    subtitleKey: 'dashboard.qaAlbumSub',
    icon: 'albums',
    gradientKey: 'cardAccent',
    route: 'Memories',
    screen: 'MemoriesHome',
  },
  {
    id: 'poll',
    titleKey: 'dashboard.qaPoll',
    subtitleKey: 'dashboard.qaPollSub',
    icon: 'bar-chart',
    gradientKey: 'cool',
    route: 'Events',
    screen: 'EventsHome',
    minorHidden: true,
  },
  {
    id: 'tree',
    titleKey: 'dashboard.qaTree',
    subtitleKey: 'dashboard.qaTreeSub',
    icon: 'git-network',
    gradientKey: 'mint',
    route: 'Profile',
    screen: 'FamilyTreeModule',
    nestedScreen: 'FamilyTreeHome',
  },
];

function ActionTile({ item, title, subtitle, index, onPress, colors, gradients, layout, radii, tileWidth }) {
  const gradient = gradients[item.gradientKey] ?? gradients.cool;

  return (
    <Animated.View
      entering={FadeInDown.delay(80 + index * 40).duration(420).springify()}
      style={{ width: tileWidth }}
    >
      <DashboardPressable onPress={() => onPress(item)} style={{ width: '100%' }} accessibilityLabel={title}>
          <LinearGradient
            colors={
              colors.isDark
                ? ['rgba(79,86,217,0.15)', 'rgba(24,24,27,0.85)']
                : ['rgba(238,240,255,0.85)', 'rgba(255,255,255,1)']
            }
            style={[
              styles.tile,
              {
                borderColor: colors.border,
                borderRadius: radii['2xl'],
                minHeight: layout.minTouch + 44,
                overflow: 'hidden',
                width: '100%',
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
            {title}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 12 * layout.fontScale,
              marginTop: 2,
            }}
          >
            {subtitle}
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
  const { t } = useI18n();

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
      <SectionTitle title={t('dashboard.quickActions')} subtitle={t('dashboard.quickActionsSubtitle')} />
      <View style={[styles.grid, { gap }]}>
        {actions.map((item, index) => (
          <ActionTile
            key={item.id}
            item={item}
            title={t(item.titleKey)}
            subtitle={t(item.subtitleKey)}
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
