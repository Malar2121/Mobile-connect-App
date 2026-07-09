import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Avatar, IconButton } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';
import { useMotion } from '../../hooks/useMotion';
import { useResponsive } from '../../design-system';
import { getGreeting, formatTodayDate } from '../../utils/dashboardHelpers';

function GreetingSectionComponent({
  userName,
  familyName,
  unreadCount,
  onNotifications,
  onSettings,
}) {
  const { colors, layout, radii } = useTheme();
  const { t, locale } = useI18n();
  const { reduceMotion } = useMotion();
  const { horizontalPadding } = useResponsive();
  const greeting = getGreeting(t);
  const dateLine = formatTodayDate(locale);

  const Wrapper = reduceMotion ? View : Animated.View;
  const wrapperProps = reduceMotion
    ? { style: [styles.wrap, { paddingHorizontal: horizontalPadding }] }
    : {
        entering: FadeInDown.duration(480).springify(),
        style: [styles.wrap, { paddingHorizontal: horizontalPadding }],
      };

  return (
    <Wrapper {...wrapperProps}>
      <View style={styles.topRow}>
        <View style={styles.identity}>
          <Avatar
            uri={undefined}
            name={userName ?? 'You'}
            size={layout.avatarSize}
            accessibilityLabel={`${userName} profile`}
          />
          <View style={styles.copy}>
            <Text
              accessibilityRole="header"
              style={{
                color: colors.textSecondary,
                fontSize: 14 * layout.fontScale,
                fontFamily: 'Inter_500Medium',
              }}
            >
              {greeting}
            </Text>
            <Text
              style={{
                color: colors.text,
                fontSize: 22 * layout.fontScale,
                fontFamily: 'Inter_700Bold',
                fontWeight: '700',
                letterSpacing: -0.4,
              }}
              numberOfLines={1}
            >
              {userName ?? 'Welcome'}
            </Text>
            <Text
              style={{
                color: colors.primary,
                fontSize: 14 * layout.fontScale,
                fontFamily: 'Inter_600SemiBold',
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {familyName}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <View>
            <IconButton
              icon="notifications-outline"
              onPress={onNotifications}
              accessibilityLabel={
                unreadCount > 0
                  ? `Notifications, ${unreadCount} unread`
                  : 'Notifications'
              }
              size="md"
            />
            {unreadCount > 0 ? (
              <View style={[styles.badgeDot, { backgroundColor: colors.error, borderColor: colors.background }]}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </View>
          <IconButton
            icon="settings-outline"
            onPress={onSettings}
            accessibilityLabel="Settings"
            size="md"
          />
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 13 * layout.fontScale,
            flex: 1,
          }}
        >
          {dateLine}
        </Text>
        <View
          style={[
            styles.weatherSlot,
            {
              backgroundColor: colors.surfaceSecondary,
              borderRadius: radii.pill,
              borderColor: colors.border,
            },
          ]}
          accessibilityLabel="Weather information not available yet"
        >
          <Text style={{ color: colors.textTertiary, fontSize: 12 * layout.fontScale }}>
            Weather · —
          </Text>
        </View>
      </View>
    </Wrapper>
  );
}

export const GreetingSection = memo(GreetingSectionComponent);

const styles = StyleSheet.create({
  wrap: { paddingTop: 8, paddingBottom: 4 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  identity: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  copy: { marginLeft: 14, flex: 1 },
  actions: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  badgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  weatherSlot: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
