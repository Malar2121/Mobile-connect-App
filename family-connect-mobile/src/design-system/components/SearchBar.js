import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

/**
 * Search bar — Telegram / Instagram inspired, with clear button.
 */
export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search',
  onClear,
  autoFocus,
  style,
  accessibilityLabel = 'Search',
}) {
  const { colors, layout, radii, isDark } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: isDark ? colors.surfaceSecondary : colors.surfaceSecondary,
          borderRadius: radii.lg,
          borderColor: colors.border,
          minHeight: layout.minTouch - 4,
        },
        style,
      ]}
    >
      <Ionicons
        name="search"
        size={layout.iconSize - 2}
        color={colors.textTertiary}
        style={styles.icon}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.input,
          {
            color: colors.text,
            fontSize: 16 * layout.fontScale,
          },
        ]}
      />
      {value?.length > 0 ? (
        <Pressable
          onPress={() => {
            onChangeText?.('');
            onClear?.();
          }}
          accessibilityLabel="Clear search"
          hitSlop={8}
          style={styles.clear}
        >
          <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
  },
  icon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontFamily: 'Inter_400Regular',
  },
  clear: { padding: 4 },
});

export { SearchBar as DSSearchBar };
