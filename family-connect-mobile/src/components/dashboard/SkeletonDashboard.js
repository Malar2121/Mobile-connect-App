import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton, SkeletonBlock, useResponsive } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

function SkeletonBlockWrap({ width, height, style, radii }) {
  return <SkeletonBlock width={width} height={height} borderRadius={style?.borderRadius ?? 14} style={style} />;
}

function SkeletonDashboardComponent({ embedded = false }) {
  const { colors, layout, radii } = useTheme();
  const { horizontalPadding, isTablet } = useResponsive();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: embedded ? 'transparent' : colors.background,
          paddingTop: embedded ? 0 : insets.top + 8,
          paddingHorizontal: horizontalPadding,
          paddingBottom: embedded ? 0 : insets.bottom + 100,
        },
      ]}
    >
      {!embedded ? (
        <View style={styles.greetingRow}>
          <Skeleton variant="avatar-row" />
        </View>
      ) : null}
      <SkeletonBlockWrap width="100%" height={isTablet ? 220 : 200} style={{ borderRadius: radii['2xl'], marginTop: 16 }} radii={radii} />
      <View style={styles.statRow}>
        <SkeletonBlockWrap width={120} height={100} style={{ borderRadius: radii.xl }} radii={radii} />
        <SkeletonBlockWrap width={120} height={100} style={{ borderRadius: radii.xl }} radii={radii} />
        <SkeletonBlockWrap width={120} height={100} style={{ borderRadius: radii.xl }} radii={radii} />
      </View>
      <SkeletonBlockWrap width="100%" height={120} style={{ borderRadius: radii['2xl'], marginTop: layout.sectionGap }} radii={radii} />
      <Skeleton variant="list-row" count={2} style={{ marginTop: layout.sectionGap }} />
      <SkeletonBlockWrap width="100%" height={280} style={{ borderRadius: radii['2xl'], marginTop: layout.sectionGap }} radii={radii} />
      <View style={[styles.grid, { marginTop: layout.sectionGap }]}>
        <SkeletonBlockWrap width="48%" height={110} style={{ borderRadius: radii.xl }} radii={radii} />
        <SkeletonBlockWrap width="48%" height={110} style={{ borderRadius: radii.xl }} radii={radii} />
        <SkeletonBlockWrap width="48%" height={110} style={{ borderRadius: radii.xl }} radii={radii} />
        <SkeletonBlockWrap width="48%" height={110} style={{ borderRadius: radii.xl }} radii={radii} />
      </View>
    </View>
  );
}

export const SkeletonDashboard = memo(SkeletonDashboardComponent);

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  greetingRow: { marginBottom: 8 },
  statRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
});
