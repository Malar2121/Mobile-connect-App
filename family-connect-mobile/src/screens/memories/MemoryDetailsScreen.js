import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Loader,
  PageHeader,
  Screen,
  SectionTitle,
  useDialog,
  useToast,
} from '../../design-system';
import { MemoryHero } from '../../components/memories';
import { useAuth } from '../../contexts/AuthContext';
import {
  getMemoryDetails,
  likeMemory,
  deleteMemory,
  getMemoryComments,
  addMemoryComment,
  reviewMemory,
} from '../../services/memoryService';
import {
  canDeleteMemory,
  canReviewMemories,
  getLikeCount,
  isLikedByUser,
  isUploadedBy,
  toggleLikeOptimistic,
} from '../../utils/memoryHelpers';
import { incrementMemoryView, loadMemoryMeta } from '../../utils/memoryModuleHelpers';
import { useFamily } from '../../contexts/FamilyContext';
import { useResponsive } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';

export default function MemoryDetailsScreen({ route, navigation }) {
  const { id } = route.params ?? {};
  const toast = useToast();
  const dialog = useDialog();
  const { user } = useAuth();

  const { t, localeTag } = useI18n();
  const { family } = useFamily();
  const { horizontalPadding } = useResponsive();
  const { colors, radii, layout } = useTheme();

  const [memory, setMemory] = useState(null);
  const [meta, setMeta] = useState({});
  const [viewCount, setViewCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [reviewing, setReviewing] = useState(false);

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
        // Comments are unavailable until a memory is approved.
        setComments([]);
      }
    } catch (e) {
      setMemory(null);
    } finally {
      setLoading(false);
    }
  }, [id, family?._id]);

  useEffect(() => { load(); }, [load]);

  const retry = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

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
    } catch {
      toast.error(t('memories.commentFailed'));
    } finally {
      setPostingComment(false);
    }
  }, [id, newComment, toast, t]);

  const handleDelete = useCallback(async () => {
    const ok = await dialog.confirm({
      title: t('memories.deleteMemory'),
      message: t('memories.deleteMemoryBody'),
      confirmLabel: t('common.delete'),
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteMemory(id);
      navigation.goBack();
    } catch {
      toast.error(t('memories.deleteFailed'));
    }
  }, [id, navigation, toast, dialog, t]);

  // Proposal §8: another member approves before the family sees a memory.
  const handleReview = useCallback(
    async (approve) => {
      const ok = await dialog.confirm({
        title: approve ? t('memoryReview.approveTitle') : t('memoryReview.rejectTitle'),
        message: approve
          ? t('memoryReview.approveMessage')
          : t('memoryReview.rejectMessage', { name: memory?.uploadedBy?.fullName ?? '' }),
        confirmLabel: approve ? t('memoryReview.approve') : t('memoryReview.reject'),
        destructive: !approve,
      });
      if (!ok) return;

      setReviewing(true);
      try {
        const updated = await reviewMemory(id, approve ? 'approve' : 'reject');
        toast.success(approve ? t('memoryReview.approved') : t('memoryReview.rejected'));
        if (approve) {
          setMemory((prev) => ({ ...prev, ...updated }));
        } else {
          // A rejected memory is no longer visible to the reviewer.
          navigation.goBack();
        }
      } catch {
        toast.error(t('memoryReview.decisionFailed'));
        await load();
      } finally {
        setReviewing(false);
      }
    },
    [dialog, id, load, memory, navigation, toast, t],
  );

  if (loading) return <Loader fullScreen />;

  if (!memory) {
    return (
      <Screen edges={['top']}>
        <PageHeader title={t('memories.memory')} onBack={() => navigation.goBack()} />
        <EmptyState icon="images-outline" title={t('memories.notFound')} />
        <Button title={t('common.retry')} variant="secondary" onPress={retry} style={{ marginTop: 12 }} />
      </Screen>
    );
  }

  const liked = isLikedByUser(memory, user?._id);
  const tags = memory.tags ?? [];
  const status = memory.status ?? 'approved';
  const isShared = status === 'approved';
  const canDecide = status === 'pending' && !isUploadedBy(memory, user) && canReviewMemories(user);
  const statusColor = status === 'rejected' ? colors.error : colors.primary;

  return (
    <Screen edges={['top']} noPadding>
      <View style={{ paddingHorizontal: horizontalPadding }}>
        <PageHeader title={t('memories.memory')} onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 40 }}>
        <MemoryHero memory={memory} viewCount={viewCount} />

        {!isShared ? (
          <Card style={{ marginTop: 12, borderWidth: 1, borderColor: statusColor }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name={status === 'rejected' ? 'eye-off-outline' : 'time-outline'} size={20} color={statusColor} />
              <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 15 * layout.fontScale }}>
                {status === 'rejected' ? t('memoryReview.notApproved') : t('memoryReview.awaitingApproval')}
              </Text>
            </View>
            <Text style={{ color: colors.textSecondary, marginTop: 6, fontSize: 13.5 * layout.fontScale, lineHeight: 20 }}>
              {status === 'rejected'
                ? t('memoryReview.rejectedNotice')
                : canDecide
                  ? t('memoryReview.reviewerNotice')
                  : t('memoryReview.pendingNotice')}
            </Text>
            {status === 'rejected' && memory.review?.reason ? (
              <Text style={{ color: colors.text, marginTop: 6, fontSize: 13.5 * layout.fontScale }}>{memory.review.reason}</Text>
            ) : null}
            {memory.review?.reviewedBy?.fullName ? (
              <Text style={{ color: colors.textTertiary, marginTop: 6, fontSize: 12 * layout.fontScale }}>
                {t('memoryReview.reviewedBy', { name: memory.review.reviewedBy.fullName })}
              </Text>
            ) : null}
            {canDecide ? (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <Button title={t('memoryReview.approve')} onPress={() => handleReview(true)} loading={reviewing} style={{ flex: 1 }} />
                <Button
                  title={t('memoryReview.reject')}
                  variant="secondary"
                  onPress={() => handleReview(false)}
                  disabled={reviewing}
                  style={{ flex: 1 }}
                />
              </View>
            ) : null}
          </Card>
        ) : null}

        {(memory.location || meta.location) ? (
          <Card style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <Text style={{ marginLeft: 8, color: colors.text }}>{memory.location || meta.location}</Text>
            </View>
          </Card>
        ) : null}

        <SectionTitle title={t('memories.taggedMembers')} style={{ marginTop: 16 }} />
        {tags.length === 0 ? (
          <Text style={{ color: colors.textSecondary }}>{t('memories.noTagged')}</Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {tags.map((tag) => (
              <View key={String(tag._id ?? tag)} style={{ alignItems: 'center' }}>
                <Avatar uri={tag.avatar} name={tag.fullName} size={44} />
                <Text style={{ fontSize: 12, marginTop: 4, color: colors.text }}>{tag.fullName}</Text>
              </View>
            ))}
          </View>
        )}

        {isShared ? (
          <>
            <SectionTitle title={t('memories.engagement')} style={{ marginTop: 16 }} />
            <Button
              title={liked ? t('memories.liked', { count: getLikeCount(memory) }) : t('memories.like', { count: getLikeCount(memory) })}
              variant={liked ? 'primary' : 'secondary'}
              onPress={handleLike}
              loading={liking}
            />

            <SectionTitle
              title={t('memories.comments')}
              subtitle={t('memories.commentCount', { count: comments.length })}
              style={{ marginTop: 20 }}
            />
            <View style={{ marginTop: 8 }}>
              {comments.map((c, idx) => (
                <Card key={c._id || idx} style={{ marginBottom: 8, padding: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>{c.author?.fullName}</Text>
                    <Text style={{ color: colors.textTertiary, fontSize: 11 }}>
                      {new Date(c.createdAt).toLocaleDateString(localeTag)}
                    </Text>
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
                  placeholder={t('memories.addNote')}
                  placeholderTextColor={colors.textTertiary}
                  value={newComment}
                  onChangeText={setNewComment}
                  accessibilityLabel={t('memories.addNote')}
                />
                <Button
                  title={t('memories.post')}
                  onPress={handlePostComment}
                  loading={postingComment}
                  disabled={!newComment.trim()}
                  style={{ marginLeft: 8 }}
                />
              </View>
            </View>
          </>
        ) : null}

        {canDeleteMemory(memory, user) ? (
          <Button title={t('memories.deleteMemory')} variant="danger" onPress={handleDelete} style={{ marginTop: 20 }} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
