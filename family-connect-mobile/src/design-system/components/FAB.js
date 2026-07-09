import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';

/**
 * Floating action button — primary gradient with shadow.
 */
export function FAB({
  onPress,
  icon,
  accessibilityLabel = 'Action',
  bottom,
  right = 20,
  size,
  variant = 'primary',
  style,
}) {
  const { colors, layout, gradients, radii, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const dim = size ?? (layout.minTouch + 8);
  const bottomOffset = bottom ?? 20 + insets.bottom + 60;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrap,
        shadows.fab,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          bottom: bottomOffset,
          right,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
        style,
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={gradients.primary}
          style={[StyleSheet.absoluteFill, { borderRadius: dim / 2 }]}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: colors.surface,
              borderRadius: dim / 2,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
            },
          ]}
        />
      )}
      <View style={styles.icon}>{icon}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { FAB as DSFAB };
