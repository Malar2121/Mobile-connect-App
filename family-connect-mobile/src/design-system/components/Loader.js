import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

/**
 * Inline / full-screen spinner using brand primary color.
 */
export function Loader({ fullScreen, size = 'large' }) {
  const { colors } = useTheme();

  const content = <ActivityIndicator size={size} color={colors.primary} />;

  if (fullScreen) {
    return (
      <View style={[styles.full, { backgroundColor: colors.background }]}>
        {content}
      </View>
    );
  }

  return <View style={styles.inline}>{content}</View>;
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inline: {
    paddingVertical: 24,
    alignItems: 'center',
  },
});

export { Loader as DSLoader };
