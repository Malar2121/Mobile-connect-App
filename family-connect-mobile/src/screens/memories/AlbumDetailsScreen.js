import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { PageHeader, Screen, Loader, useToast, useDialog } from '../../design-system';
import { AlbumHeader, GalleryGrid } from '../../components/memories';
import { getAlbum, deleteAlbum, shareAlbum } from '../../services/albumService';
import { useAuth } from '../../contexts/AuthContext';
import { useResponsive } from '../../design-system';

export default function AlbumDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const toast = useToast();
  const dialog = useDialog();
  const { user } = useAuth();
  const { horizontalPadding } = useResponsive();
  const { id } = route.params ?? {};

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await getAlbum(id);
      setData(result);
    } catch (e) {
      toast.error(e.message || 'Album not found');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => { load(); }, [load]);

  const isOwner =
    data?.album &&
    (String(data.album.createdBy?._id ?? data.album.createdBy) === String(user?._id) || user?.role === 'admin');

  const handleShare = useCallback(async () => {
    try {
      const result = await shareAlbum(id);
      toast.success('Share link ready');
      if (result?.shareLink) toast.success(result.shareLink);
    } catch (e) {
      toast.error(e.message || 'Share failed');
    }
  }, [id, toast]);

  const handleDelete = useCallback(async () => {
    const ok = await dialog.confirm({ title: 'Delete album?', destructive: true, confirmLabel: 'Delete' });
    if (!ok) return;
    try {
      await deleteAlbum(id);
      navigation.goBack();
    } catch (e) {
      toast.error(e.message || 'Delete failed');
    }
  }, [dialog, id, navigation, toast]);

  if (loading) return <Loader fullScreen />;

  return (
    <Screen edges={['top']}>
      <PageHeader title={data?.album?.title ?? 'Album'} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <AlbumHeader album={data?.album} onShare={handleShare} canManage={isOwner} />
        {(data?.media ?? []).length === 0 ? (
          <Text style={{ color: '#64748B' }}>No media in this album yet. Add memories from memory details.</Text>
        ) : (
          <GalleryGrid
            memories={data.media}
            onPress={(m) => navigation.navigate('MemoryDetails', { id: String(m._id) })}
          />
        )}
        {isOwner ? (
          <Text onPress={handleDelete} style={{ color: '#EF4444', marginTop: 24, textAlign: 'center' }}>
            Delete album
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
