import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

function CategoryChipComponent({ label, color, compact, selected, onPress }) {
  const { colors, layout, radii } = useTheme();
  const bg = color ? `${color}22` : colors.primarySubtle;
  const fg = color ?? colors.primary;

  const content = (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: selected ? fg : bg,
          borderColor: selected ? fg : `${fg}44`,
          borderRadius: radii.full,
        },
        compact && styles.compact,
      ]}
    >
      <Text
        style={{
          color: selected ? '#fff' : fg,
          fontFamily: 'Inter_600SemiBold',
          fontSize: (compact ? 11 : 12) * layout.fontScale,
        }}
      >
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }
  return content;
}

export const CategoryChip = memo(CategoryChipComponent);

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 10, paddingVertical: 5, borderWidth: StyleSheet.hairlineWidth, alignSelf: 'flex-start' },
  compact: { paddingHorizontal: 8, paddingVertical: 3 },
});
