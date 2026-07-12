import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FAB, PageHeader, Screen, TextField, Button, useToast } from '../../design-system';
import { AlbumCard } from '../../components/memories';
import { useMemoriesModuleData } from '../../hooks/useMemoriesModuleData';
import { createAlbum } from '../../services/albumService';
import { useResponsive } from '../../design-system';

export default function AlbumsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { horizontalPadding } = useResponsive();
  const { albums, refreshing, refresh, isMinor } = useMemoriesModuleData();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await createAlbum({ title: title.trim() });
      setTitle('');
      setShowForm(false);
      await refresh();
      toast.success('Album created');
    } catch (e) {
      toast.error(e.message || 'Could not create album');
    } finally {
      setCreating(false);
    }
  }, [title, refresh, toast]);

  return (
    <Screen edges={['top']}>
      <PageHeader title="Albums" subtitle={`${albums.length} collections`} onBack={() => navigation.goBack()} />
      {showForm && !isMinor ? (
        <View style={{ marginBottom: 12 }}>
          <TextField label="Album title" value={title} onChangeText={setTitle} placeholder="Summer reunion" />
          <Button title="Create album" onPress={handleCreate} loading={creating} style={{ marginTop: 8 }} />
        </View>
      ) : null}
      <FlatList
        data={albums}
        keyExtractor={(item) => String(item._id)}
        renderItem={({ item }) => (
          <View >
            <AlbumCard album={item} onPress={(a) => navigation.navigate('AlbumDetails', { id: String(a._id) })} />
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        initialNumToRender={8}
      />
      {!isMinor ? (
        <FAB
          onPress={() => setShowForm((v) => !v)}
          bottom={20 + insets.bottom + 52}
          icon={<Ionicons name="add" size={28} color="#fff" />}
        />
      ) : null}
    </Screen>
  );
}
