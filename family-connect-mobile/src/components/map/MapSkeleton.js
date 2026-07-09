import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton, SkeletonBlock } from '../../design-system';

function MapSkeletonComponent() {
  return (
    <View style={styles.wrap}>
      <SkeletonBlock height={56} style={{ marginBottom: 12, borderRadius: 16 }} />
      <SkeletonBlock height={320} style={{ borderRadius: 20 }} />
    </View>
  );
}

export const MapSkeleton = memo(MapSkeletonComponent);

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16 },
});
