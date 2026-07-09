import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

/**
 * Section title with optional action link — Google Calendar style.
 */
export function SectionTitle({
  title,
  subtitle,
  actionLabel,
  onAction,
  style,
}) {
  const { colors, layout, spacing } = useTheme();

  return (
    <View style={[styles.wrap, { marginBottom: spacing.md }, style]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text
            accessibilityRole="header"
            style={{
              color: colors.text,
              fontSize: 17 * layout.fontScale,
              fontFamily: 'Inter_700Bold',
              fontWeight: '700',
              letterSpacing: -0.2,
            }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 13 * layout.fontScale,
                marginTop: 2,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={onAction}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text
              style={{
                color: colors.primary,
                fontSize: 14 * layout.fontScale,
                fontFamily: 'Inter_600SemiBold',
                fontWeight: '600',
              }}
            >
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
});

export { SectionTitle as DSSectionTitle };
