import React, { memo } from 'react';
import { Skeleton, SkeletonBlock } from '../../design-system';

function MemorySkeletonComponent() {
  return (
    <>
      <SkeletonBlock height={100} style={{ marginBottom: 12, borderRadius: 16 }} />
      <Skeleton variant="list-row" count={4} />
    </>
  );
}

export const MemorySkeleton = memo(MemorySkeletonComponent);
