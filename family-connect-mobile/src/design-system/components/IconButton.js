import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

const SIZES = { sm: 36, md: 44, lg: 52 };

/**
 * Icon button wrapper — consistent touch target and variants.
 */
export function IconButton({
  icon,
  onPress,
  size = 'md',
  variant = 'surface',
  color,
  disabled,
  accessibilityLabel,
  style,
}) {
  const { colors, layout, radii, isDark } = useTheme();
  const dim = SIZES[size] ?? layout.minTouch;
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 26 : layout.iconSize;

  const bgMap = {
    surface: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)',
    ghost: 'transparent',
    primary: colors.primarySubtle,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? icon}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: bgMap[variant] ?? bgMap.surface,
          borderColor: variant === 'surface' ? colors.border : 'transparent',
          borderWidth: variant === 'surface' ? StyleSheet.hairlineWidth : 0,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {typeof icon === 'string' ? (
        <Ionicons name={icon} size={iconSize} color={color ?? colors.text} />
      ) : (
        <View>{icon}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { IconButton as DSIconButton };
