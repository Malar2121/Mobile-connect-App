import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { DashboardAnimatedNumber } from './DashboardAnimatedNumber';
import { DashboardPressable } from './DashboardPressable';
import { useTheme } from '../../hooks/useTheme';
import {
  dashboardGradients,
  dashboardRadii,
  dashboardShadows,
  dashboardSpacing,
  dashboardTypography,
} from '../../constants/dashboardTheme';

const STAT_ITEMS = [
  { key: 'events', label: 'Events', icon: 'calendar', gradientKey: 'cool' },
  { key: 'memories', label: 'Memories', icon: 'heart', gradientKey: 'warm' },
  { key: 'photos', label: 'Photos', icon: 'image', gradientKey: 'mint' },
  { key: 'locations', label: 'Locations', icon: 'location', gradientKey: 'sunset' },
];

function StatCard({ item, value, index, onPress, colors, isDark }) {
  const gradients = dashboardGradients(isDark);
  const gradient = gradients[item.gradientKey];

  return (
    <Animated.View entering={FadeInRight.delay(index * 60).duration(400).springify()}>
      <DashboardPressable onPress={onPress}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, dashboardShadows.soft]}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={`${item.icon}-outline`} size={20} color="#fff" />
          </View>
          <DashboardAnimatedNumber value={value} style={styles.value} />
          <Text style={styles.label}>{item.label}</Text>
        </LinearGradient>
      </DashboardPressable>
    </Animated.View>
  );
}

export function DashboardQuickStats({ stats, onStatPress }) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.text, fontFamily: dashboardTypography.fontSemi },
        ]}
      >
        Quick stats
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {STAT_ITEMS.map((item, index) => (
          <StatCard
            key={item.key}
            item={item}
            value={stats[item.key] ?? 0}
            index={index}
            colors={colors}
            isDark={isDark}
            onPress={() => onStatPress?.(item.key)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: dashboardSpacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    letterSpacing: -0.3,
    marginBottom: dashboardSpacing.sm,
    paddingHorizontal: dashboardSpacing.screen,
  },
  scroll: {
    paddingHorizontal: dashboardSpacing.screen,
    gap: 12,
    paddingBottom: 4,
  },
  card: {
    width: 120,
    minHeight: 128,
    borderRadius: dashboardRadii.lg,
    padding: 16,
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 28,
    color: '#fff',
    letterSpacing: -0.5,
    marginTop: 12,
  },
  label: {
    color: 'rgba(255,255,255,0.92)',
    fontFamily: dashboardTypography.fontMedium,
    fontSize: 13,
    marginTop: 2,
  },
});
