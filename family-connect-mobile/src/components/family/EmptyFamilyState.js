import React, { memo } from 'react';
import { EmptyState } from '../../design-system';
import { View } from 'react-native';
import { useI18n } from '../../i18n';

function EmptyFamilyStateComponent({ title, description, onCreate, onJoin, actionLabel }) {
  const { t } = useI18n();
  if (actionLabel) {
    return (
      <EmptyState
        icon="people-outline"
        title={title ?? t('family.noFamilyYet')}
        description={description ?? t('family.createAFamilyOrJoinWith')}
        actionLabel={actionLabel}
        onAction={onCreate}
      />
    );
  }

  return (
    <View>
      <EmptyState
        icon="people-outline"
        title={title ?? t('family.noFamilyYet')}
        description={description ?? t('family.createAFamilyOrJoinWith')}
        actionLabel={t('family.createButton')}
        onAction={onCreate}
        secondaryLabel={onJoin ? t('family.joinWithCode') : undefined}
        onSecondary={onJoin}
      />
    </View>
  );
}

export const EmptyFamilyState = memo(EmptyFamilyStateComponent);
