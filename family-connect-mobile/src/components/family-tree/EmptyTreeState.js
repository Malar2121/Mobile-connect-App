import React, { memo } from 'react';
import { EmptyState } from '../../design-system';
import { useI18n } from '../../i18n';

function EmptyTreeStateComponent({ onAction, canManage }) {
  const { t } = useI18n();
  return (
    <EmptyState
      icon="git-network-outline"
      title={t('tree.emptyTitle')}
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
