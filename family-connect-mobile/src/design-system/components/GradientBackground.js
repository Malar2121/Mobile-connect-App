import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';

/**
 * Full-screen or section gradient background.
 */
export function GradientBackground({
  children,
  variant = 'hero',
  style,
}) {
  const { gradients } = useTheme();
  const colors = gradients[variant] ?? gradients.hero;

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.fill, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

export { GradientBackground as DSGradientBackground };
