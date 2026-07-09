import React, { memo } from 'react';
import { EmptyState } from '../../design-system';

function EmptyMemoriesComponent({ title, description, onUpload, isMinor }) {
  return (
    <EmptyState
      icon="images-outline"
      title={title ?? 'Your archive awaits'}
      description={description ?? (isMinor ? 'Family memories will appear here.' : 'Upload photos and videos to begin preserving your family history.')}
      actionLabel={isMinor ? undefined : 'Upload memory'}
      onAction={isMinor ? undefined : onUpload}
    />
  );
}

export const EmptyMemories = memo(EmptyMemoriesComponent);
