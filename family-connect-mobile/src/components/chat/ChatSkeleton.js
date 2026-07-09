import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton, SkeletonBlock } from '../../design-system';

function ChatSkeletonComponent() {
  return (
    <View style={styles.wrap}>
      <SkeletonBlock height={56} style={{ marginBottom: 16, borderRadius: 16 }} />
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={[styles.row, i % 2 === 0 ? styles.right : styles.left]}>
          <Skeleton width={i % 2 === 0 ? '62%' : '58%'} height={64} />
        </View>
      ))}
    </View>
  );
}

export const ChatSkeleton = memo(ChatSkeletonComponent);

const styles = StyleSheet.create({
  wrap: { padding: 16, flex: 1 },
  row: { marginBottom: 12 },
  left: { alignItems: 'flex-start' },
  right: { alignItems: 'flex-end' },
});
