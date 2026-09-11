import React, { memo } from 'react';
import { SearchBar } from '../../design-system';
import { useI18n } from '../../i18n';

function EventSearchBarComponent({ value, onChangeText, placeholder }) {
  const { t } = useI18n();
  return (
    <SearchBar
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder ?? t('events.searchEvents2')}
      accessibilityLabel={t('events.searchEvents')}
    />
  );
}

export const EventSearchBar = memo(EventSearchBarComponent);
