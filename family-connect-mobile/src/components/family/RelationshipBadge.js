import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

function RelationshipBadgeComponent({ label, compact }) {
  const { colors, layout, radii } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.primarySubtle,
          borderRadius: radii.full,
          borderColor: colors.border,
        },
        compact && styles.compact,
      ]}
      accessibilityLabel={`Relationship: ${label}`}
    >
      <Text
        style={{
          color: colors.primary,
          fontFamily: 'Inter_600SemiBold',
          fontSize: (compact ? 11 : 12) * layout.fontScale,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export const RelationshipBadge = memo(RelationshipBadgeComponent);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
  compact: { paddingHorizontal: 8, paddingVertical: 3 },
});
