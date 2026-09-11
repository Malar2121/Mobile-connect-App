import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, FAB, PageHeader, Screen, SectionTitle } from '../../design-system';
import { useMemoriesModuleData } from '../../hooks/useMemoriesModuleData';
import {
  AlbumCard,
  EmptyMemories,
  MemoriesQuickActions,
  MemoryAnalyticsCard,
  MemoryCard,
  MemorySkeleton,
  StoryRings,
  StoryViewer,
} from '../../components/memories';
import { useResponsive } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';

export default function MemoriesHomeScreen() {
  const navigation = useNavigation();
  const { t } = useI18n();
  const { colors, layout } = useTheme();
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);

  const {
    loading,
    refreshing,
    refresh,
    recentMemories,
    featured,
    onThisDay,
    albums,
    photos,
    videos,
    analytics,
    isMinor,
    error,
    canReview,
    pendingReview,
    myHiddenUploads,
  } = useMemoriesModuleData();

  const navigate = useCallback((screen, params) => navigation.navigate(screen, params), [navigation]);
  const openMemory = useCallback((mem) => navigate('MemoryDetails', { id: String(mem._id) }), [navigate]);

  if (loading && !refreshing) {
    return (
      <Screen edges={['top']}>
        <PageHeader title={t('memories.title')} subtitle={t('memories.subtitle')} large />
        <MemorySkeleton />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} noPadding>
      <View style={{ paddingHorizontal: horizontalPadding }}>
        <PageHeader title={t('memories.title')} subtitle={t('memories.subtitle2')} large />
        {error ? <Text style={{ color: '#EF4444', marginBottom: 8 }}>{error}</Text> : null}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: insets.bottom + 120 }}
      >
        {canReview && pendingReview.length > 0 ? (
          <Card style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
              <Text
                style={{ flex: 1, color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 15 * layout.fontScale }}
              >
                {t('memoryReview.banner', { count: pendingReview.length })}
              </Text>
            </View>
            <Button title={t('memoryReview.review')} onPress={() => navigate('MemoryApprovals')} style={{ marginTop: 10 }} />
          </Card>
        ) : null}

        <MemoriesQuickActions onNavigate={navigate} isMinor={isMinor} />
        <MemoryAnalyticsCard analytics={analytics} />

        <StoryRings
          memories={recentMemories}
          onOpenStory={(i) => {
            setStoryIndex(i);
            setStoryOpen(true);
          }}
        />

        {myHiddenUploads.length > 0 ? (
          <>
            <SectionTitle title={t('memoryReview.yourUploads')} style={{ marginTop: 8 }} />
            {myHiddenUploads.map((m) => (
              <MemoryCard key={m._id} memory={m} onPress={openMemory} compact />
            ))}
          </>
        ) : null}

        {onThisDay.length > 0 ? (
          <>
            <SectionTitle title={t('memories.onThisDay')} subtitle={t('memories.yearsPast')} />
            {onThisDay.map((m) => (
              <MemoryCard key={m._id} memory={m} onPress={openMemory} compact />
            ))}
          </>
        ) : null}

        <SectionTitle title={t('memories.featured')} subtitle={t('memories.mostLoved')} style={{ marginTop: 8 }} />
        {featured.length === 0 ? (
          <EmptyMemories onUpload={() => navigate('UploadMemory')} isMinor={isMinor} />
        ) : (
          featured.map((m) => <MemoryCard key={m._id} memory={m} onPress={openMemory} />)
        )}

        <SectionTitle title={t('memories.recent')} style={{ marginTop: 8 }} />
        {recentMemories.slice(0, 6).map((m) => (
          <MemoryCard key={m._id} memory={m} onPress={openMemory} compact />
        ))}
        <Text
          onPress={() => navigate('MemoryGallery')}
          accessibilityRole="button"
          style={{ color: '#4F56D9', fontFamily: 'Inter_600SemiBold', marginTop: 8 }}
        >
          {t('memories.viewFullGallery')} →
        </Text>

        <SectionTitle title={t('memories.albums')} subtitle={t('memories.collections', { count: albums.length })} style={{ marginTop: 16 }} />
        {albums.slice(0, 4).map((a) => (
          <AlbumCard key={a._id} album={a} onPress={(alb) => navigate('AlbumDetails', { id: String(alb._id) })} />
        ))}
        <Text
          onPress={() => navigate('Albums')}
          accessibilityRole="button"
          style={{ color: '#4F56D9', fontFamily: 'Inter_600SemiBold' }}
        >
          {t('memories.allAlbums')} →
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 16 }}>
          <Text onPress={() => navigate('MemoryGallery', { filter: 'photos' })} accessibilityRole="button" style={{ color: '#4F56D9' }}>
            {t('memories.photoCount', { count: photos.length })}
          </Text>
          <Text onPress={() => navigate('MemoryGallery', { filter: 'videos' })} accessibilityRole="button" style={{ color: '#4F56D9' }}>
            {t('memories.videoCount', { count: videos.length })}
          </Text>
        </View>
      </ScrollView>

      {!isMinor ? (
        <FAB
          onPress={() => navigate('UploadMemory')}
          bottom={20 + insets.bottom + 52}
          icon={<Ionicons name="cloud-upload-outline" size={26} color="#fff" />}
          accessibilityLabel={t('memories.uploadMemory')}
        />
      ) : null}

      <StoryViewer
        memories={recentMemories}
        visible={storyOpen}
        initialIndex={storyIndex}
        onClose={() => setStoryOpen(false)}
      />
    </Screen>
  );
}
