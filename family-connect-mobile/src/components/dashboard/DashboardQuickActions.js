import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { DashboardPressable } from './DashboardPressable';
import { useTheme } from '../../hooks/useTheme';
import {
  dashboardGradients,
  dashboardRadii,
  dashboardShadows,
  dashboardSpacing,
  dashboardTypography,
} from '../../constants/dashboardTheme';

const ACTIONS = [
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
    id: 'gallery',
    title: 'Family Gallery',
    subtitle: 'Browse albums',
    icon: 'images',
    gradientKey: 'cardAccent',
    route: 'Memories',
    screen: 'MemoryGallery',
  },
  {
    id: 'invite',
    title: 'Invite Member',
    subtitle: 'Grow your circle',
    icon: 'person-add',
    gradientKey: 'warm',
    action: 'invite',
  },
];

function ActionCard({ item, onPress, isDark, colors }) {
  const gradients = dashboardGradients(isDark);
  const gradient = gradients[item.gradientKey] ?? gradients.cool;

  return (
    <DashboardPressable onPress={onPress} style={styles.cardWrap}>
      <LinearGradient
        colors={
          isDark
            ? ['rgba(99,102,241,0.14)', 'rgba(22,27,34,0.5)']
            : ['rgba(99,102,241,0.08)', 'rgba(255,255,255,0.95)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          dashboardShadows.soft,
          {
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.08)',
          },
        ]}
      >
        <LinearGradient colors={gradient} style={styles.iconBadge}>
          <Ionicons name={`${item.icon}-outline`} size={22} color="#fff" />
        </LinearGradient>
        <Text
          style={[styles.title, { color: colors.text, fontFamily: dashboardTypography.fontSemi }]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: colors.textSecondary, fontFamily: dashboardTypography.fontRegular },
          ]}
          numberOfLines={1}
        >
          {item.subtitle}
        </Text>
      </LinearGradient>
    </DashboardPressable>
  );
}

export function DashboardQuickActions({ onAction, isMinor }) {
  const { colors, isDark } = useTheme();
  const visible = ACTIONS.filter((a) => !(isMinor && a.minorHidden));

  return (
    <Animated.View entering={FadeInDown.delay(280).duration(520).springify()} style={styles.section}>
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.text, fontFamily: dashboardTypography.fontSemi },
        ]}
      >
        Quick actions
      </Text>
      <View style={styles.grid}>
        {visible.map((item) => (
          <ActionCard
            key={item.id}
            item={item}
            isDark={isDark}
            colors={colors}
            onPress={() => onAction(item)}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: dashboardSpacing.screen,
    marginBottom: dashboardSpacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    letterSpacing: -0.3,
    marginBottom: dashboardSpacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardWrap: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '46%',
    maxWidth: '48%',
  },
  card: {
    borderRadius: dashboardRadii.lg,
    padding: 16,
    minHeight: 118,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
  },
});
