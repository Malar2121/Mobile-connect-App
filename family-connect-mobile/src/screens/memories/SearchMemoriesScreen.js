import React, { useMemo, useState } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PageHeader, Screen } from '../../design-system';
import { MemoryCard, SearchFilterBar } from '../../components/memories';
import { useMemoriesModuleData } from '../../hooks/useMemoriesModuleData';
import { useResponsive } from '../../design-system';

export default function SearchMemoriesScreen() {
  const navigation = useNavigation();
  const { horizontalPadding } = useResponsive();
  const [query, setQuery] = useState('');
  const [year, setYear] = useState(null);

  const { filtered, memories } = useMemoriesModuleData({ query, year });

  const years = useMemo(() => {
    const set = new Set();
    memories.forEach((m) => {
      if (m.createdAt) set.add(new Date(m.createdAt).getFullYear());
    });
    return [...set].sort((a, b) => b - a);
  }, [memories]);

  return (
    <Screen edges={['top']}>
      <PageHeader title="Search" subtitle="Find any memory" onBack={() => navigation.goBack()} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item._id)}
        ListHeaderComponent={
          <SearchFilterBar query={query} onChangeQuery={setQuery} years={years} selectedYear={year} onYearChange={setYear} />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
        renderItem={({ item }) => (
          <MemoryCard memory={item} onPress={(m) => navigation.navigate('MemoryDetails', { id: String(m._id) })} />
        )}
        initialNumToRender={10}
        maxToRenderPerBatch={12}
        windowSize={8}
      />
    </Screen>
  );
}
