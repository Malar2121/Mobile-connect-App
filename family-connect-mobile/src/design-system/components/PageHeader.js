import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { IconButton } from './IconButton';

/**
 * Consistent page header — title, subtitle, back + action slots.
 */
export function PageHeader({
  title,
  subtitle,
  onBack,
  rightAction,
  rightIcon,
  onRightPress,
  large = false,
  transparent,
}) {
  const { colors, layout, spacing } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingBottom: spacing.md,
          backgroundColor: transparent ? 'transparent' : colors.background,
        },
      ]}
    >
      <View style={styles.row}>
        {onBack ? (
          <IconButton
            icon="chevron-back"
            onPress={onBack}
            accessibilityLabel="Go back"
            variant="ghost"
            size="md"
          />
        ) : null}

        <View style={[styles.center, { flex: 1, marginLeft: onBack ? 0 : 0 }]}>
          <Text
            accessibilityRole="header"
            numberOfLines={2}
            style={{
              color: colors.text,
              fontSize: (large ? 28 : 20) * layout.fontScale,
              fontFamily: 'Inter_700Bold',
              fontWeight: '700',
              letterSpacing: large ? -0.5 : 0,
              textAlign: 'left',
            }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14 * layout.fontScale,
                marginTop: 4,
                textAlign: 'left',
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightAction ? (
          rightAction
        ) : rightIcon ? (
          <IconButton
            icon={rightIcon}
            onPress={onRightPress}
            variant="ghost"
            size="md"
          />
        ) : onBack ? (
          <View style={{ width: 44 }} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    paddingHorizontal: 4,
  },
});

export { PageHeader as DSPageHeader };
