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
          ? t('tree.mapRelationshipsToVisualizeYourFamily')
          : t('tree.askAFamilyAdminToMap')
      }
      actionLabel={canManage ? t('tree.mapRelationships') : undefined}
      onAction={canManage ? onAction : undefined}
    />
  );
}

export const EmptyTreeState = memo(EmptyTreeStateComponent);
