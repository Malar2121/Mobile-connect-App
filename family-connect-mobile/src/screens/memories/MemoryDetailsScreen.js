import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  Avatar,
  Button,
  Card,
  Loader,
  PageHeader,
  Screen,
  SectionTitle,
  useToast,
} from '../../design-system';
import { MemoryHero } from '../../components/memories';
import { useAuth } from '../../contexts/AuthContext';
import { getMemoryDetails, likeMemory, deleteMemory } from '../../services/memoryService';
import { addMediaToAlbum } from '../../services/albumService';
import {
  canDeleteMemory,
  formatMemoryDate,
  getLikeCount,
  isLikedByUser,
  toggleLikeOptimistic,
} from '../../utils/memoryHelpers';
import { incrementMemoryView, loadMemoryMeta } from '../../utils/memoryModuleHelpers';
import { useFamily } from '../../contexts/FamilyContext';
import { useResponsive } from '../../design-system';

export default function MemoryDetailsScreen({ route, navigation }) {
  const { id } = route.params ?? {};
  const toast = useToast();
  const { user } = useAuth();
  const { family } = useFamily();
  const { horizontalPadding } = useResponsive();

  const [memory, setMemory] = useState(null);
  const [meta, setMeta] = useState({});
  const [viewCount, setViewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getMemoryDetails(id);
      setMemory(data);
      const m = await loadMemoryMeta(id);
      setMeta(m);
      if (family?._id) {
        const views = await incrementMemoryView(family._id, id);
        setViewCount(views);
      }
    } catch (e) {
      toast.error(e.message || 'Memory not found');
    } finally {
      setLoading(false);
    }
  }, [id, family?._id, toast]);

  useEffect(() => { load(); }, [load]);

  const handleLike = useCallback(async () => {
    if (!memory || liking) return;
    setLiking(true);
    const snap = memory;
    setMemory(toggleLikeOptimistic(memory, user?._id));
    try {
      const updated = await likeMemory(memory._id);
      setMemory((prev) => ({ ...prev, ...updated }));
    } catch {
      setMemory(snap);
    } finally {
      setLiking(false);
    }
  }, [memory, liking, user?._id]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteMemory(id);
      navigation.goBack();
    } catch (e) {
      toast.error(e.message || 'Delete failed');
    }
  }, [id, navigation, toast]);

  if (loading) return <Loader fullScreen />;
  if (!memory) return null;

  const liked = isLikedByUser(memory, user?._id);
  const tags = memory.tags ?? [];

  return (
    <Screen edges={['top']} style={{ paddingHorizontal: 0 }}>
      <View style={{ paddingHorizontal: horizontalPadding }}>
        <PageHeader title="Memory" onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 40 }}>
        <MemoryHero memory={memory} viewCount={viewCount} />

        {meta.location ? (
          <Card style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="location-outline" size={18} color="#4F56D9" />
              <Text style={{ marginLeft: 8 }}>{meta.location}</Text>
            </View>
          </Card>
        ) : null}

        <SectionTitle title="Tagged members" style={{ marginTop: 16 }} />
        {tags.length === 0 ? (
          <Text style={{ color: '#64748B' }}>No members tagged.</Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {tags.map((t) => (
              <View key={String(t._id ?? t)} style={{ alignItems: 'center' }}>
                <Avatar uri={t.avatar} name={t.fullName} size={44} />
                <Text style={{ fontSize: 12, marginTop: 4 }}>{t.fullName}</Text>
              </View>
            ))}
          </View>
        )}

        <SectionTitle title="Engagement" style={{ marginTop: 16 }} />
        <Button
          title={liked ? `Liked · ${getLikeCount(memory)}` : `Like · ${getLikeCount(memory)}`}
          variant={liked ? 'primary' : 'secondary'}
          onPress={handleLike}
          loading={liking}
        />

        <SectionTitle title="Comments" subtitle="Architecture ready" style={{ marginTop: 20 }} />
        <Card>
          <Text style={{ color: '#94A3B8', fontSize: 13 }}>TODO: Memory comments API — thread UI prepared for backend integration.</Text>
        </Card>

        {canDeleteMemory(memory, user) ? (
          <Button title="Delete memory" variant="danger" onPress={handleDelete} style={{ marginTop: 20 }} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
