import React, { memo } from 'react';
import { EmptyState } from '../../design-system';

function EmptyTreeStateComponent({ onAction, canManage }) {
  return (
    <EmptyState
      icon="git-network-outline"
      title="Your family tree awaits"
      message={
        canManage
          ? 'Map relationships to visualize your family across generations.'
          : 'Ask a family admin to map relationships so everyone can explore the tree.'
      }
      actionLabel={canManage ? 'Map relationships' : undefined}
      onAction={canManage ? onAction : undefined}
    />
  );
}

export const EmptyTreeState = memo(EmptyTreeStateComponent);
