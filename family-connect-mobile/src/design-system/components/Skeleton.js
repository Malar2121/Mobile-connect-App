import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

/**
 * Shimmer skeleton block.
 */
function SkeletonBlock({ width, height, borderRadius, style }) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: borderRadius ?? 10,
          backgroundColor: colors.skeleton,
        },
        animStyle,
        style,
      ]}
    />
  );
}

/**
 * Skeleton loader — card, list row, avatar row, stat grid presets.
 */
export function Skeleton({ variant = 'card', count = 1, style }) {
  const { layout, radii, spacing } = useTheme();

  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'avatar-row') {
    return (
      <View style={[styles.row, style]}>
        <SkeletonBlock width={layout.avatarSize} height={layout.avatarSize} borderRadius={radii.pill} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <SkeletonBlock width="60%" height={16} />
          <SkeletonBlock width="40%" height={12} style={{ marginTop: 8 }} />
        </View>
      </View>
    );
  }

  if (variant === 'list-row') {
    return (
      <View style={style}>
        {items.map((i) => (
          <View key={i} style={[styles.listRow, { marginBottom: spacing.md }]}>
            <SkeletonBlock width="100%" height={72} borderRadius={radii.xl} />
          </View>
        ))}
      </View>
    );
  }

  if (variant === 'stat-grid') {
    return (
      <View style={[styles.statGrid, style]}>
        <SkeletonBlock width="48%" height={88} borderRadius={radii.xl} />
        <SkeletonBlock width="48%" height={88} borderRadius={radii.xl} />
      </View>
    );
  }

  return (
    <View style={style}>
      {items.map((i) => (
        <SkeletonBlock
          key={i}
          width="100%"
          height={120}
          borderRadius={radii.xl}
          style={{ marginBottom: spacing.md }}
        />
      ))}
    </View>
  );
}

/**
 * Full-screen loading with skeleton placeholders.
 */
export function SkeletonScreen() {
  const { colors, layout, spacing } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, padding: layout.contentPadding }]}>
      <SkeletonBlock width="70%" height={28} borderRadius={8} />
      <SkeletonBlock width="45%" height={16} style={{ marginTop: spacing.sm }} />
      <Skeleton variant="stat-grid" style={{ marginTop: spacing['2xl'] }} />
      <Skeleton variant="list-row" count={3} style={{ marginTop: spacing['2xl'] }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  listRow: {},
  statGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  screen: { flex: 1 },
});

export { Skeleton as DSSkeleton, SkeletonBlock };
