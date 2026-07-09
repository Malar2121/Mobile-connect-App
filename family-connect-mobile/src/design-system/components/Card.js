import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

/**
 * Elevated surface card — consistent depth and padding.
 */
export function Card({
  children,
  style,
  padded = true,
  variant = 'elevated',
  accessibilityLabel,
}) {
  const { colors, layout, radii, shadows } = useTheme();

  const bgMap = {
    elevated: colors.surface,
    secondary: colors.surfaceSecondary,
    outlined: colors.surface,
  };

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.card,
        shadows.sm,
        {
          backgroundColor: bgMap[variant] ?? colors.surface,
          borderColor: colors.border,
          borderRadius: radii.xl,
          padding: padded ? layout.sectionGap * 0.85 : 0,
          borderWidth: variant === 'outlined' ? StyleSheet.hairlineWidth : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});

export { Card as DSCard };
