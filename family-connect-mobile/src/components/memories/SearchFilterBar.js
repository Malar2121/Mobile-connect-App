import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, SearchBar } from '../../design-system';

function SearchFilterBarComponent({ query, onChangeQuery, years, selectedYear, onYearChange }) {
  return (
    <View>
      <SearchBar value={query} onChangeText={onChangeQuery} placeholder="Search captions, albums…" />
      {years?.length ? (
        <View style={styles.chips}>
          <Chip label="All years" selected={!selectedYear} onPress={() => onYearChange?.(null)} />
          {years.map((y) => (
            <Chip key={y} label={String(y)} selected={selectedYear === y} onPress={() => onYearChange?.(y)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export const SearchFilterBar = memo(SearchFilterBarComponent);

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
});
