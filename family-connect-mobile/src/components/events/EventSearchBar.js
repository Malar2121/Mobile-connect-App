import React, { memo } from 'react';
import { SearchBar } from '../../design-system';

function EventSearchBarComponent({ value, onChangeText, placeholder }) {
  return (
    <SearchBar
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder ?? 'Search events…'}
      accessibilityLabel="Search events"
    />
  );
}

export const EventSearchBar = memo(EventSearchBarComponent);
