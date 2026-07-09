import React, { memo } from 'react';
import { EmptyState } from '../../design-system';
import { View } from 'react-native';

function EmptyFamilyStateComponent({ title, description, onCreate, onJoin, actionLabel }) {
  if (actionLabel) {
    return (
      <EmptyState
        icon="people-outline"
        title={title ?? 'No family yet'}
        description={description ?? 'Create a family or join with an invite code to unlock family management.'}
        actionLabel={actionLabel}
        onAction={onCreate}
      />
    );
  }

  return (
    <View>
      <EmptyState
        icon="people-outline"
        title={title ?? 'No family yet'}
        description={description ?? 'Create a family or join with an invite code to unlock family management.'}
        actionLabel="Create family"
        onAction={onCreate}
        secondaryLabel={onJoin ? 'Join with code' : undefined}
        onSecondary={onJoin}
      />
    </View>
  );
}

export const EmptyFamilyState = memo(EmptyFamilyStateComponent);
