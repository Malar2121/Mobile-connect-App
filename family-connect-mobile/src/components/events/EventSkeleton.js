import React, { memo } from 'react';
import { Skeleton, SkeletonBlock } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

function EventSkeletonComponent({ count = 4 }) {
  const { layout } = useTheme();
  return (
    <>
      <SkeletonBlock height={120} style={{ marginBottom: 12, borderRadius: 16 }} />
      <Skeleton variant="list-row" count={count} />
    </>
  );
}

export const EventSkeleton = memo(EventSkeletonComponent);
