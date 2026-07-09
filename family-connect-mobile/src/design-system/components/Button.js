import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useMotion } from '../../hooks/useMotion';

const VARIANTS = {
  primary: 'primary',
  secondary: 'secondary',
  ghost: 'ghost',
  danger: 'danger',
  outline: 'outline',
};

/**
 * Premium button — primary CTA, secondary, ghost, danger, outline variants.
 */
export function Button({
  title,
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  icon,
  iconRight,
  style,
  textStyle: textStyleProp,
  accessibilityLabel,
  fullWidth = true,
}) {
  const { colors, layout, isDark, gradients, radii, shadows } = useTheme();
  const { pressTransform } = useMotion();
  const text = title ?? label;
  const isPrimary = variant === VARIANTS.primary;
  const isSecondary = variant === VARIANTS.secondary;
  const isGhost = variant === VARIANTS.ghost;
  const isDanger = variant === VARIANTS.danger;
  const isOutline = variant === VARIANTS.outline;

  const heightMap = { sm: 40, md: layout.minTouch, lg: layout.minTouch + (layout.buttonScale ? 10 : 8) };
  const minHeight = heightMap[size] ?? layout.minTouch;
  const fontSize = (size === 'sm' ? 14 : size === 'lg' ? 17 : 16) * layout.fontScale;

  const content = (
    <>
      {loading ? (
        <ActivityIndicator
          color={
            isPrimary || isDanger
              ? colors.textInverse
              : isGhost
                ? colors.primary
                : colors.primary
          }
        />
      ) : (
        <View style={styles.row}>
          {icon ? <View style={styles.iconLeft}>{icon}</View> : null}
          <Text
            style={[
              styles.label,
              {
                fontSize,
                color: isPrimary || isDanger
                  ? colors.textInverse
                  : isGhost
                    ? colors.primary
                    : isOutline
                      ? colors.text
                      : colors.primary,
              },
              textStyleProp,
            ]}
          >
            {text}
          </Text>
          {iconRight ? <View style={styles.iconRight}>{iconRight}</View> : null}
        </View>
      )}
    </>
  );

  const baseStyle = [
    styles.base,
    {
      minHeight,
      borderRadius: radii.lg,
      opacity: disabled || loading ? 0.5 : 1,
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
      paddingHorizontal: size === 'sm' ? 16 : 22,
    },
    !isPrimary && !isDanger && {
      backgroundColor: isGhost
        ? 'transparent'
        : isSecondary
          ? colors.primarySubtle
          : isOutline
            ? 'transparent'
            : colors.surface,
      borderWidth: isOutline || isSecondary ? StyleSheet.hairlineWidth : 0,
      borderColor: isOutline ? colors.borderStrong : isSecondary ? colors.primaryMuted : 'transparent',
    },
    isDanger && { backgroundColor: colors.error },
    style,
  ];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? text}
      accessibilityState={{ disabled: disabled || loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        ...baseStyle,
        pressed && !disabled && pressTransform.length && { opacity: 0.88, transform: pressTransform },
      ]}
    >
      {isPrimary ? (
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radii.lg }]}
        />
      ) : null}
      <View style={styles.content}>{content}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
});

export { Button as DSButton };
