import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../hooks/useTheme';

/**
 * Glassmorphism card — frosted blur surface (Telegram Premium / iOS style).
 */
export function GlassCard({
  children,
  style,
  intensity,
  noPadding,
  borderless,
}) {
  const { colors, isDark, radii, layout, shadows } = useTheme();

  return (
    <View style={[styles.wrap, shadows.sm, { borderRadius: radii['2xl'] }, style]}>
      <BlurView
        intensity={intensity ?? (isDark ? 56 : 80)}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.blur,
          {
            backgroundColor: colors.glass,
            borderColor: borderless ? 'transparent' : colors.glassBorder,
            borderRadius: radii['2xl'],
          },
        ]}
      >
        <View style={[styles.inner, noPadding && styles.noPad, !noPadding && { padding: layout.contentPadding }]}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  blur: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  inner: {},
  noPad: { padding: 0 },
});

export { GlassCard as DSGlassCard };
