import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import {
  dashboardRadii,
  dashboardSpacing,
  dashboardTypography,
  dashboardGradients,
} from '../../constants/dashboardTheme';

export function DashboardEmptyIllustration({
  icon,
  title,
  message,
  gradient,
  compact,
}) {
  const { colors, isDark } = useTheme();
  const g = gradient ?? dashboardGradients(isDark).cool;

  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <LinearGradient colors={g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ring}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.9)' },
          ]}
        >
          <Ionicons name={icon} size={compact ? 28 : 36} color={colors.primary} />
        </View>
      </LinearGradient>
      <Text
        style={[
          styles.title,
          {
            color: colors.text,
            fontFamily: dashboardTypography.fontSemi,
            fontSize: compact ? 15 : 17,
          },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.message,
          {
            color: colors.textSecondary,
            fontFamily: dashboardTypography.fontRegular,
            fontSize: compact ? 13 : 14,
          },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: dashboardSpacing.md,
    paddingHorizontal: dashboardSpacing.sm,
  },
  compact: {
    paddingVertical: dashboardSpacing.sm,
  },
  ring: {
    width: 88,
    height: 88,
    borderRadius: dashboardRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: dashboardSpacing.sm,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: dashboardRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});
