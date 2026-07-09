import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton, SkeletonBlock } from '../../design-system';
import { useResponsive } from '../../design-system';

function TreeSkeletonComponent() {
  const { horizontalPadding } = useResponsive();

  return (
    <View style={{ paddingHorizontal: horizontalPadding, paddingTop: 8 }}>
      <SkeletonBlock height={140} style={{ marginBottom: 16, borderRadius: 20 }} />
      <View style={styles.stats}>
        <Skeleton width="48%" height={88} />
        <Skeleton width="48%" height={88} />
      </View>
      <SkeletonBlock height={220} style={{ marginTop: 16, borderRadius: 20 }} />
      <SkeletonBlock height={120} style={{ marginTop: 16, borderRadius: 16 }} />
    </View>
  );
}

export const TreeSkeleton = memo(TreeSkeletonComponent);

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
});
