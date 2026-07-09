import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

const VARIANT_STYLES = {
  filled: (colors, isDark) => ({
    bg: colors.primarySubtle,
    text: colors.primary,
    border: 'transparent',
  }),
  outline: (colors) => ({
    bg: 'transparent',
    text: colors.text,
    border: colors.borderStrong,
  }),
  success: (colors) => ({
    bg: colors.successMuted,
    text: colors.success,
    border: 'transparent',
  }),
  warning: (colors) => ({
    bg: colors.warningMuted,
    text: colors.warning,
    border: 'transparent',
  }),
  danger: (colors) => ({
    bg: colors.errorMuted,
    text: colors.error,
    border: 'transparent',
  }),
};

/**
 * Selectable / filter chip.
 */
export function Chip({
  label,
  selected,
  onPress,
  variant = 'filled',
  icon,
  disabled,
  accessibilityLabel,
}) {
  const { colors, layout, radii, isDark } = useTheme();
  const v = VARIANT_STYLES[variant]?.(colors, isDark) ?? VARIANT_STYLES.filled(colors, isDark);
  const sel = selected
    ? { bg: colors.primary, text: colors.textInverse, border: colors.primary }
    : v;

  const content = (
  <>
      {icon}
      <Text
        style={[
          styles.label,
          {
            color: sel.text,
            fontSize: 13 * layout.fontScale,
            marginLeft: icon ? 6 : 0,
          },
        ]}
      >
        {label}
      </Text>
    </>
  );

  const baseStyle = [
    styles.chip,
    {
      backgroundColor: sel.bg,
      borderColor: sel.border,
      borderRadius: radii.pill,
      minHeight: Math.max(32, layout.minTouch * 0.72),
      paddingHorizontal: 14,
      opacity: disabled ? 0.5 : 1,
    },
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ selected, disabled }}
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [...baseStyle, pressed && { opacity: 0.85 }]}
      >
        {content}
      </Pressable>
    );
  }

  return <Pressable style={baseStyle} pointerEvents="none">{content}</Pressable>;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
});

export { Chip as DSChip };
