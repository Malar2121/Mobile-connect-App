import React, { useCallback } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../components/Avatar';
import {
  EmptyState,
  FAB,
  PageHeader,
  Screen,
  Skeleton,
  useResponsive,
} from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { useMemoriesModuleData } from '../../hooks/useMemoriesModuleData';
import { useAccessibilityPolicy } from '../../hooks/useAccessibilityPolicy';
import { filterPhotos, filterVideos } from '../../utils/memoryModuleHelpers';
import { getLikeCount, getUploader } from '../../utils/memoryHelpers';

function MemoryGridItem({ memory, size, onPress, colors, layout, isElder, isDark }) {
  const uploader = getUploader(memory);
  const likeCount = getLikeCount(memory);
  const isVideo = memory.mediaType === 'video';
  const avatarSize = isElder ? 28 : 22;
  const nameSize = (isElder ? 13 : 11) * layout.fontScale;

  return (
    <Pressable
      onPress={() => onPress(memory)}
      style={({ pressed }) => [{ width: size, opacity: pressed ? 0.92 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={memory.caption || 'Memory'}
    >
      <View
        style={[
          styles.thumbWrap,
          {
            width: size,
            height: size,
            borderColor: colors.border,
            backgroundColor: isDark ? colors.card : '#E8E8ED',
          },
        ]}
      >
        {isVideo ? (
          <View style={styles.videoPh}>
            <Image source={{ uri: memory.mediaUrl }} style={styles.thumb} resizeMode="cover" />
            <View style={[styles.videoOverlay, { backgroundColor: colors.overlay }]}>
              <Ionicons name="play-circle" size={isElder ? 44 : 36} color="#fff" />
            </View>
          </View>
        ) : (
          <Image source={{ uri: memory.mediaUrl }} style={styles.thumb} resizeMode="cover" />
        )}
        <View style={[styles.likeBadge, { backgroundColor: colors.overlay }]}>
          <Ionicons name="heart" size={12} color="#fff" />
          <Text style={styles.likeBadgeText}>{likeCount}</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Avatar uri={uploader.avatar} name={uploader.fullName} size={avatarSize} />
        <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '600', fontSize: nameSize, marginLeft: 6, flex: 1 }}>
          {uploader.fullName ?? 'Member'}
        </Text>
      </View>
    </Pressable>
  );
}

export default function MemoryGalleryScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { colors, layout, uiMode, isDark } = useTheme();
  const { horizontalPadding } = useResponsive();
  const { width } = useWindowDimensions();
  const filter = route.params?.filter;

  const { memories: allMemories, loading, refreshing, refresh, error } = useMemoriesModuleData();
  const policy = useAccessibilityPolicy();
  const memories =
    filter === 'photos'
      ? filterPhotos(allMemories).filter((m) => policy.canShowSensitiveMedia(m))
      : filter === 'videos'
        ? filterVideos(allMemories).filter((m) => policy.canShowSensitiveMedia(m))
        : allMemories.filter((m) => policy.canShowSensitiveMedia(m));

  const isMinor = uiMode === 'minor';
  const isElder = uiMode === 'elder';
  const gap = isElder ? 12 : 8;
  const numCols = 2;
  const size = (width - horizontalPadding * 2 - gap) / numCols;
  const fabBottom = 20 + insets.bottom + 52;

  const openDetails = useCallback(
    (memory) => navigation.navigate('MemoryDetails', { id: String(memory._id) }),
    [navigation],
  );

  const title =
    filter === 'photos' ? 'Photos' : filter === 'videos' ? 'Videos' : 'Gallery';

  if (loading && !refreshing) {
    return (
      <Screen edges={['top']}>
        <PageHeader title={title} subtitle="Loading…" large onBack={() => navigation.goBack()} />
        <Skeleton variant="list-row" count={4} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} noPadding>
      <View style={{ paddingHorizontal: horizontalPadding }}>
        <PageHeader
          title={title}
          subtitle={`${memories.length} items`}
          large
          onBack={() => navigation.goBack()}
          rightAction={
            !isMinor ? (
              <Pressable onPress={() => navigation.navigate('UploadMemory')} hitSlop={8}>
                <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 15 * layout.fontScale }}>Upload</Text>
              </Pressable>
            ) : undefined
          }
        />
        {error ? <Text style={{ color: colors.error, marginBottom: 8, fontSize: 14 * layout.fontScale }}>{error}</Text> : null}
      </View>

      <FlatList
        data={memories}
        keyExtractor={(item) => String(item._id)}
        numColumns={numCols}
        columnWrapperStyle={{ gap }}
        contentContainerStyle={{
          padding: horizontalPadding,
          gap,
          flexGrow: 1,
          paddingBottom: isMinor ? layout.sectionGap * 2 : fabBottom + 56,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />}
        initialNumToRender={12}
        maxToRenderPerBatch={16}
        windowSize={9}
        removeClippedSubviews
        ListEmptyComponent={
          <EmptyState
            icon="images-outline"
            title="No memories yet"
            description={isMinor ? 'Family photos and videos will appear here.' : 'Share the first family moment — tap + to upload.'}
            actionLabel={isMinor ? undefined : 'Upload memory'}
            onAction={isMinor ? undefined : () => navigation.navigate('UploadMemory')}
            compact
          />
        }
        renderItem={({ item }) => (
          <MemoryGridItem
            memory={item}
            size={size}
            onPress={openDetails}
            colors={colors}
            layout={layout}
            isElder={isElder}
            isDark={isDark}
          />
        )}
      />

      {!isMinor ? (
        <FAB
          onPress={() => navigation.navigate('UploadMemory')}
          accessibilityLabel="Upload memory"
          bottom={fabBottom}
          icon={<Ionicons name="cloud-upload-outline" size={26} color="#fff" />}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  thumbWrap: { borderRadius: 16, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  thumb: { width: '100%', height: '100%' },
  videoPh: { flex: 1, width: '100%', height: '100%' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  likeBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  likeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 2 },
});
