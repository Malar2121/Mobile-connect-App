import React, { memo } from 'react';
import { EmptyState } from '../../design-system';
import { useI18n } from '../../i18n';

function EmptyEventsComponent({ title, description, onCreate, isMinor }) {
  const { t } = useI18n();
  return (
    <EmptyState
      icon="calendar-outline"
      title={title ?? t('events.noneYet')}
      description={
        description ??
        (isMinor
          ? t('events.familyEventsWillAppearHereWhen')
          : t('events.planYourFirstFamilyGatheringBirthdays'))
      }
      actionLabel={isMinor ? undefined : t('events.create')}
      onAction={isMinor ? undefined : onCreate}
    />
  );
}

export const EmptyEvents = memo(EmptyEventsComponent);
