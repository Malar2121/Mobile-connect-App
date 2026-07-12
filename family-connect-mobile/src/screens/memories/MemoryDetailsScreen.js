import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View, TextInput } from 'react-native';
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
import { getMemoryDetails, likeMemory, deleteMemory, getMemoryComments, addMemoryComment } from '../../services/memoryService';
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
import { useTheme } from '../../hooks/useTheme';

export default function MemoryDetailsScreen({ route, navigation }) {
  const { id } = route.params ?? {};
  const toast = useToast();
  const { user } = useAuth();
  const { family } = useFamily();
  const { horizontalPadding } = useResponsive();
  const { colors, radii } = useTheme();

  const [memory, setMemory] = useState(null);
  const [meta, setMeta] = useState({});
  const [viewCount, setViewCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
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
      try {
        const c = await getMemoryComments(id);
        setComments(c);
      } catch (err) {
        setComments([]);
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

  const handlePostComment = useCallback(async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const added = await addMemoryComment(id, newComment);
      setComments((prev) => [...prev, added]);
      setNewComment('');
    } catch (e) {
      toast.error(e.message || 'Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  }, [id, newComment, toast]);

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

        {(memory.location || meta.location) ? (
          <Card style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <Text style={{ marginLeft: 8, color: colors.text }}>{memory.location || meta.location}</Text>
            </View>
          </Card>
        ) : null}

        <SectionTitle title="Tagged members" style={{ marginTop: 16 }} />
        {tags.length === 0 ? (
          <Text style={{ color: colors.textSecondary }}>No members tagged.</Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {tags.map((t) => (
              <View key={String(t._id ?? t)} style={{ alignItems: 'center' }}>
                <Avatar uri={t.avatar} name={t.fullName} size={44} />
                <Text style={{ fontSize: 12, marginTop: 4, color: colors.text }}>{t.fullName}</Text>
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

        <SectionTitle title="Comments" subtitle={`${comments.length} comments`} style={{ marginTop: 20 }} />
        <View style={{ marginTop: 8 }}>
          {comments.map((c, idx) => (
            <Card key={c._id || idx} style={{ marginBottom: 8, padding: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>{c.author?.fullName}</Text>
                <Text style={{ color: colors.textTertiary, fontSize: 11 }}>{new Date(c.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}>{c.content}</Text>
            </Card>
          ))}
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <TextInput
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radii.md,
                paddingHorizontal: 12,
                color: colors.text,
                fontFamily: 'Inter_400Regular',
              }}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textTertiary}
              value={newComment}
              onChangeText={setNewComment}
            />
            <Button title="Post" onPress={handlePostComment} loading={postingComment} disabled={!newComment.trim()} style={{ marginLeft: 8 }} />
          </View>
        </View>

        {canDeleteMemory(memory, user) ? (
          <Button title="Delete memory" variant="danger" onPress={handleDelete} style={{ marginTop: 20 }} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
