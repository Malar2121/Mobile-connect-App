import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  Screen,
  useDialog,
  useToast,
} from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';
import { getPendingMemories, reviewMemory } from '../../services/memoryService';
import { formatMemoryDate, getUploader } from '../../utils/memoryHelpers';

/**
 * Review queue for shared photos and videos (proposal §8: "Members approve
 * shared photos and videos"). The server decides who may review; this screen
 * reports its answer rather than guessing.
 */
export default function MemoryApprovalsScreen() {
  const navigation = useNavigation();
  const { colors, layout, radii } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const dialog = useDialog();

  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      setPending(await getPendingMemories());
    } catch {
      setError(t('memoryReview.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const decide = useCallback(
    async (item, approve) => {
      const uploader = getUploader(item);
      const ok = await dialog.confirm({
        title: approve ? t('memoryReview.approveTitle') : t('memoryReview.rejectTitle'),
        message: approve
          ? t('memoryReview.approveMessage')
          : t('memoryReview.rejectMessage', { name: uploader.fullName ?? '' }),
        confirmLabel: approve ? t('memoryReview.approve') : t('memoryReview.reject'),
        destructive: !approve,
      });
      if (!ok) return;

      setBusyId(item._id);
      try {
        await reviewMemory(item._id, approve ? 'approve' : 'reject');
        toast.success(approve ? t('memoryReview.approved') : t('memoryReview.rejected'));
        setPending((prev) => prev.filter((m) => m._id !== item._id));
      } catch {
        toast.error(t('memoryReview.decisionFailed'));
        // Another member may have decided first; show the current queue.
        await load();
      } finally {
        setBusyId(null);
      }
    },
    [dialog, toast, load, t],
  );

  const renderItem = useCallback(
    ({ item }) => {
      const uploader = getUploader(item);
      const isVideo = item.mediaType === 'video';
      const title = item.caption || (isVideo ? t('memories.memoryVideo') : t('memories.memoryPhoto'));

      return (
        <Card style={{ marginBottom: 12 }}>
          <Pressable
            onPress={() => navigation.navigate('MemoryDetails', { id: String(item._id) })}
            accessibilityRole="button"
            accessibilityLabel={title}
            style={styles.row}
          >
            <View style={[styles.thumb, { borderRadius: radii.lg, borderColor: colors.border }]}>
              <Image source={{ uri: item.mediaUrl }} style={styles.image} contentFit="cover" />
              {isVideo ? (
                <View style={styles.play}>
                  <Ionicons name="play" size={18} color="#fff" />
                </View>
              ) : null}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 15 * layout.fontScale }}
                numberOfLines={2}
              >
                {title}
              </Text>
              <Text
                style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale, marginTop: 4 }}
                numberOfLines={1}
              >
                {t('memoryReview.sharedBy', { name: uploader.fullName ?? '' })}
              </Text>
              <Text style={{ color: colors.textTertiary, fontSize: 12 * layout.fontScale, marginTop: 2 }}>
                {formatMemoryDate(item.createdAt)}
              </Text>
            </View>
          </Pressable>

          <View style={styles.actions}>
            <Button
              title={t('memoryReview.approve')}
              onPress={() => decide(item, true)}
              loading={busyId === item._id}
              style={{ flex: 1 }}
            />
            <Button
              title={t('memoryReview.reject')}
              variant="secondary"
              onPress={() => decide(item, false)}
              disabled={busyId === item._id}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      );
    },
    [colors, layout, radii, busyId, decide, navigation, t],
  );

  return (
    <Screen edges={['top']}>
      <PageHeader
        title={t('memoryReview.queueTitle')}
        subtitle={t('memoryReview.queueSubtitle')}
        onBack={() => navigation.goBack()}
      />

      {error ? (
        <Card style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.error, fontSize: 14 * layout.fontScale }}>{error}</Text>
          <Button title={t('common.retry')} variant="secondary" onPress={load} style={{ marginTop: 10 }} />
        </Card>
      ) : null}

      <FlatList
        data={pending}
        keyExtractor={(item) => String(item._id)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={
          loading ? (
            <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale }}>
              {t('common.loading')}
            </Text>
          ) : error ? null : (
            <EmptyState
              icon="shield-checkmark-outline"
              title={t('memoryReview.emptyTitle')}
              description={t('memoryReview.emptyBody')}
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 88, height: 88, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  image: { width: '100%', height: '100%' },
  play: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
});
