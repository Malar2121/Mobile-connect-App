import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Button } from './Button';

/**
 * Empty state — illustration icon, title, description, optional CTA.
 */
export function EmptyState({
  icon = 'albums-outline',
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  compact,
}) {
  const { colors, layout, radii, spacing } = useTheme();

  return (
    <View
      accessibilityRole="text"
      style={[
        styles.wrap,
        {
          paddingVertical: compact ? spacing.lg : spacing['3xl'],
          paddingHorizontal: spacing['2xl'],
        },
      ]}
    >
      <View
        style={[
          styles.iconRing,
          {
            backgroundColor: colors.primarySubtle,
            borderRadius: radii['3xl'],
            width: compact ? 64 : 80,
            height: compact ? 64 : 80,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={compact ? 32 : 40}
          color={colors.primary}
        />
      </View>
      <Text
        style={{
          color: colors.text,
          fontSize: (compact ? 17 : 20) * layout.fontScale,
          fontFamily: 'Inter_700Bold',
          fontWeight: '700',
          marginTop: spacing.lg,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      {description ? (
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 15 * layout.fontScale,
            lineHeight: 22 * layout.fontScale,
            marginTop: spacing.sm,
            textAlign: 'center',
            maxWidth: 300,
          }}
        >
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          style={{ marginTop: spacing['2xl'], minWidth: 200 }}
        />
      ) : null}
      {secondaryLabel && onSecondary ? (
        <Button
          title={secondaryLabel}
          variant="ghost"
          onPress={onSecondary}
          style={{ marginTop: spacing.sm }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { EmptyState as DSEmptyState };
