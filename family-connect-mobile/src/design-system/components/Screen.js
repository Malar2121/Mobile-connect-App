import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../utils/responsive';
import { GradientBackground } from './GradientBackground';

/**
 * Screen wrapper — safe area, responsive max-width, optional gradient.
 */
export function Screen({
  children,
  scroll,
  gradient,
  edges = ['top'],
  style,
  contentStyle,
  refreshControl,
}) {
  const { colors, layout } = useTheme();
  const { isTablet, contentMaxWidth, horizontalPadding } = useResponsive();

  const inner = (
    <View
      style={[
        styles.content,
        {
          paddingHorizontal: horizontalPadding,
          maxWidth: isTablet ? contentMaxWidth : undefined,
          alignSelf: isTablet ? 'center' : 'stretch',
          width: isTablet ? '100%' : undefined,
          paddingBottom: layout.sectionGap,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      keyboardShouldPersistTaps="handled"
    >
      {inner}
    </ScrollView>
  ) : (
    inner
  );

  const container = (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: gradient ? 'transparent' : colors.background }, style]}
      edges={edges}
    >
      {body}
    </SafeAreaView>
  );

  if (gradient) {
    return <GradientBackground variant={gradient}>{container}</GradientBackground>;
  }

  return container;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1 },
  content: { flex: 1 },
});

export { Screen as DSScreen };
