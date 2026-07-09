import React, { memo } from 'react';
import { EmptyState } from '../../design-system';

function EmptyEventsComponent({ title, description, onCreate, isMinor }) {
  return (
    <EmptyState
      icon="calendar-outline"
      title={title ?? 'No events yet'}
      description={
        description ??
        (isMinor
          ? 'Family events will appear here when scheduled.'
          : 'Plan your first family gathering — birthdays, dinners, trips, and more.')
      }
      actionLabel={isMinor ? undefined : 'Create event'}
      onAction={isMinor ? undefined : onCreate}
    />
  );
}

export const EmptyEvents = memo(EmptyEventsComponent);
