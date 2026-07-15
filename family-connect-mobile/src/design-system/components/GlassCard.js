import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

/**
 * Solid card replacing the previous glassmorphism effect.
 */
export function GlassCard({
  children,
  style,
  noPadding,
  borderless,
}) {
  const { colors, radii, layout, shadows } = useTheme();

  return (
    <View style={[styles.wrap, shadows.md, { borderRadius: radii['2xl'] }, style]}>
      <View
        style={[
          styles.solid,
          {
            backgroundColor: colors.surfaceElevated,
            borderRadius: radii['2xl'],
          },
        ]}
      >
        <View style={[styles.inner, noPadding && styles.noPad, !noPadding && { padding: layout.contentPadding }]}>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { 
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  solid: {
    overflow: 'hidden',
  },
  inner: {},
  noPad: { padding: 0 },
});

export { GlassCard as DSGlassCard };
