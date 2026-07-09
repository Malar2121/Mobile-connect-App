import React from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { BlurView } from 'expo-blur';

import Animated, { FadeInDown } from 'react-native-reanimated';

import { IconButton } from '../../design-system';

import { useTheme } from '../../hooks/useTheme';

import { dashboardSpacing, dashboardTypography } from '../../constants/dashboardTheme';



function getGreeting() {

  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';

  if (hour < 17) return 'Good afternoon';

  return 'Good evening';

}



export function DashboardHeader({

  familyName,

  liveCount,

  memberCount,

  onNotifications,

  onSettings,

}) {

  const { colors, isDark, gradients, layout, radii } = useTheme();



  return (

    <Animated.View entering={FadeInDown.duration(520).springify()}>

      <LinearGradient

        colors={gradients.header}

        start={{ x: 0, y: 0 }}

        end={{ x: 1, y: 1 }}

        style={[styles.gradient, { borderRadius: radii['2xl'] }]}

      >

        <BlurView intensity={isDark ? 32 : 48} tint={isDark ? 'dark' : 'light'} style={styles.blur}>

          <View style={styles.row}>

            <View style={styles.copy}>

              <Text

                style={[

                  styles.greeting,

                  { color: colors.textSecondary, fontFamily: dashboardTypography.fontMedium },

                ]}

              >

                {getGreeting()} 👋

              </Text>

              <Text

                style={[

                  styles.familyName,

                  {

                    color: colors.text,

                    fontFamily: dashboardTypography.fontBold,

                    fontSize: 28 * layout.fontScale,

                  },

                ]}

                numberOfLines={2}

              >

                {familyName}

              </Text>

              <View style={styles.liveRow}>

                <View style={[styles.liveDot, { backgroundColor: colors.success }]} />

                <Text

                  style={{

                    color: colors.textSecondary,

                    fontFamily: dashboardTypography.fontMedium,

                    fontSize: 13 * layout.fontScale,

                  }}

                >

                  {liveCount} live · {memberCount} member{memberCount === 1 ? '' : 's'}

                </Text>

              </View>

            </View>



            <View style={styles.actions}>

              <IconButton

                icon="notifications-outline"

                onPress={onNotifications}

                accessibilityLabel="Notifications"

                size="md"

              />

              <IconButton

                icon="settings-outline"

                onPress={onSettings}

                accessibilityLabel="Settings"

                size="md"

              />

            </View>

          </View>

        </BlurView>

      </LinearGradient>

    </Animated.View>

  );

}



const styles = StyleSheet.create({

  gradient: { overflow: 'hidden', marginBottom: dashboardSpacing.sm },

  blur: {

    paddingHorizontal: dashboardSpacing.screen,

    paddingTop: dashboardSpacing.sm,

    paddingBottom: dashboardSpacing.md,

  },

  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: dashboardSpacing.sm },

  copy: { flex: 1 },

  greeting: { fontSize: 14, letterSpacing: 0.2 },

  familyName: { letterSpacing: -0.6, marginTop: 4, lineHeight: 34 },

  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },

  liveDot: { width: 8, height: 8, borderRadius: 4 },

  actions: { flexDirection: 'row', gap: 8, paddingTop: 4 },

});

