import React, { memo } from 'react';
import { EmptyState } from '../../design-system';
import { useI18n } from '../../i18n';

function EmptyMemoriesComponent({ title, description, onUpload, isMinor }) {
  const { t } = useI18n();
  return (
    <EmptyState
      icon="images-outline"
      title={title ?? t('memories.yourArchiveAwaits')}
      description={description ?? (isMinor ? t('memories.familyMemoriesWillAppearHere') : t('memories.uploadPhotosAndVideosToBegin'))}
      actionLabel={isMinor ? undefined : t('memories.upload')}
      onAction={isMinor ? undefined : onUpload}
    />
  );
}

export const EmptyMemories = memo(EmptyMemoriesComponent);
