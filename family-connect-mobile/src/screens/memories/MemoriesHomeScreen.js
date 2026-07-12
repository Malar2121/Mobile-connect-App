import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FAB, PageHeader, Screen, SectionTitle } from '../../design-system';
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

export default function MemoriesHomeScreen() {
  const navigation = useNavigation();
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
  } = useMemoriesModuleData();

  const navigate = useCallback((screen, params) => navigation.navigate(screen, params), [navigation]);

  if (loading && !refreshing) {
    return (
      <Screen edges={['top']}>
        <PageHeader title="Memories" subtitle="Family archive" large />
        <MemorySkeleton />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} noPadding>
      <View style={{ paddingHorizontal: horizontalPadding }}>
        <PageHeader title="Memories" subtitle="Digital family archive" large />
        {error ? <Text style={{ color: '#EF4444', marginBottom: 8 }}>{error}</Text> : null}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: insets.bottom + 120 }}
      >
        <MemoriesQuickActions onNavigate={navigate} isMinor={isMinor} />
        <MemoryAnalyticsCard analytics={analytics} />

        <StoryRings
          memories={recentMemories}
          onOpenStory={(i) => {
            setStoryIndex(i);
            setStoryOpen(true);
          }}
        />

        {onThisDay.length > 0 ? (
          <>
            <SectionTitle title="On this day" subtitle="Memories from years past" />
            {onThisDay.map((m) => (
              <MemoryCard key={m._id} memory={m} onPress={(mem) => navigate('MemoryDetails', { id: String(mem._id) })} compact />
            ))}
          </>
        ) : null}

        <SectionTitle title="Featured" subtitle="Most loved memories" style={{ marginTop: 8 }} />
        {featured.length === 0 ? (
          <EmptyMemories onUpload={() => navigate('UploadMemory')} isMinor={isMinor} />
        ) : (
          featured.map((m) => (
            <MemoryCard key={m._id} memory={m} onPress={(mem) => navigate('MemoryDetails', { id: String(mem._id) })} />
          ))
        )}

        <SectionTitle title="Recent" style={{ marginTop: 8 }} />
        {recentMemories.slice(0, 6).map((m) => (
          <MemoryCard key={m._id} memory={m} onPress={(mem) => navigate('MemoryDetails', { id: String(mem._id) })} compact />
        ))}
        <Text onPress={() => navigate('MemoryGallery')} style={{ color: '#4F56D9', fontFamily: 'Inter_600SemiBold', marginTop: 8 }}>
          View full gallery →
        </Text>

        <SectionTitle title="Albums" subtitle={`${albums.length} collections`} style={{ marginTop: 16 }} />
        {albums.slice(0, 4).map((a) => (
          <AlbumCard key={a._id} album={a} onPress={(alb) => navigate('AlbumDetails', { id: String(alb._id) })} />
        ))}
        <Text onPress={() => navigate('Albums')} style={{ color: '#4F56D9', fontFamily: 'Inter_600SemiBold' }}>All albums →</Text>

        <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
          <Text onPress={() => navigate('MemoryGallery', { filter: 'photos' })} style={{ color: '#4F56D9' }}>{photos.length} photos</Text>
          <Text onPress={() => navigate('MemoryGallery', { filter: 'videos' })} style={{ color: '#4F56D9' }}>{videos.length} videos</Text>
        </View>
      </ScrollView>

      {!isMinor ? (
        <FAB
          onPress={() => navigate('UploadMemory')}
          bottom={20 + insets.bottom + 52}
          icon={<Ionicons name="cloud-upload-outline" size={26} color="#fff" />}
          accessibilityLabel="Upload memory"
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
