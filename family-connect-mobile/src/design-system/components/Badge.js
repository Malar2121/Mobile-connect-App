import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

const BADGE_VARIANTS = {
  default: (c) => ({ bg: c.surfaceSecondary, text: c.textSecondary }),
  primary: (c) => ({ bg: c.primarySubtle, text: c.primary }),
  success: (c) => ({ bg: c.successMuted, text: c.success }),
  warning: (c) => ({ bg: c.warningMuted, text: c.warning }),
  danger: (c) => ({ bg: c.errorMuted, text: c.error }),
  info: (c) => ({ bg: c.infoMuted, text: c.info }),
};

/**
 * Status badge — RSVP, notification count, live indicators.
 */
export function Badge({ label, variant = 'default', size = 'sm', dot, style }) {
  const { colors, layout, radii } = useTheme();
  const v = BADGE_VARIANTS[variant]?.(colors) ?? BADGE_VARIANTS.default(colors);
  const fontSize = (size === 'md' ? 13 : 11) * layout.fontScale;
  const padV = size === 'md' ? 6 : 4;
  const padH = size === 'md' ? 12 : 8;

  return (
    <View
      accessibilityRole="text"
      style={[
        styles.badge,
        {
          backgroundColor: v.bg,
          borderRadius: radii.pill,
          paddingVertical: padV,
          paddingHorizontal: padH,
        },
        style,
      ]}
    >
      {dot ? (
        <View style={[styles.dot, { backgroundColor: v.text }]} />
      ) : null}
      <Text
        style={[
          styles.label,
          { color: v.text, fontSize, marginLeft: dot ? 6 : 0 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
});

export { Badge as DSBadge };
