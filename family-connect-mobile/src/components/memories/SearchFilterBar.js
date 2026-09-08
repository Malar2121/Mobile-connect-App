import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, SearchBar } from '../../design-system';
import { useI18n } from '../../i18n';

function SearchFilterBarComponent({ query, onChangeQuery, years, selectedYear, onYearChange }) {
  const { t } = useI18n();
  return (
    <View>
      <SearchBar value={query} onChangeText={onChangeQuery} placeholder={t('memories.searchPlaceholder')} />
      {years?.length ? (
        <View style={styles.chips}>
          <Chip label={t('memories.allYears')} selected={!selectedYear} onPress={() => onYearChange?.(null)} />
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
