import React from 'react';
import { FlatList, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PageHeader, Screen } from '../../design-system';
import { AlbumCard } from '../../components/memories';
import { useMemoriesModuleData } from '../../hooks/useMemoriesModuleData';
import { useResponsive } from '../../design-system';

export default function SharedAlbumsScreen() {
  const navigation = useNavigation();
  const { horizontalPadding } = useResponsive();
  const { albums } = useMemoriesModuleData();
  const shared = albums.filter((a) => a.isShared);

  return (
    <Screen edges={['top']}>
      <PageHeader title="Shared albums" subtitle="Family collections" onBack={() => navigation.goBack()} />
      <FlatList
        data={shared}
        keyExtractor={(item) => String(item._id)}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 32 }}
        ListEmptyComponent={
          <Text style={{ color: '#64748B', textAlign: 'center', marginTop: 24 }}>
            No shared albums yet. Share an album from album details.
          </Text>
        }
        renderItem={({ item }) => (
          <AlbumCard album={item} onPress={(a) => navigation.navigate('AlbumDetails', { id: String(a._id) })} />
        )}
      />
    </Screen>
  );
}
