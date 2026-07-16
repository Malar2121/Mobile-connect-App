import React, { memo } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Avatar, SectionTitle } from '../../design-system';
import { DashboardPressable } from './DashboardPressable';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';
import { getUploader, getLikeCount } from '../../utils/dashboardHelpers';
import { formatMemoryDate } from '../../utils/memoryHelpers';
import { useI18n } from '../../i18n';

const STORY_WIDTH = Dimensions.get('window').width * 0.72;

function StoryCard({ memory, onPress, colors, layout, radii, isDark }) {
  const uploader = getUploader(memory);
  const likes = getLikeCount(memory);
  const isVideo = memory.mediaType === 'video';

  return (
    <DashboardPressable
      onPress={() => onPress?.(memory)}
      accessibilityLabel={`Memory by ${uploader.fullName}`}
    >
      <View style={[styles.story, { borderRadius: radii['2xl'], width: STORY_WIDTH }]}>
        {isVideo ? (
          <View style={styles.media}>
            <Image source={{ uri: memory.mediaUrl }} style={styles.image} contentFit="cover" />
            <View style={[styles.videoOverlay, { backgroundColor: colors.overlay }]}>
              <Ionicons name="play-circle" size={48} color="#fff" />
            </View>
          </View>
        ) : (
          <Image source={{ uri: memory.mediaUrl }} style={styles.image} contentFit="cover" />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          style={[styles.gradient, { borderBottomLeftRadius: radii['2xl'], borderBottomRightRadius: radii['2xl'] }]}
        />
        <View style={styles.footer}>
          <View style={styles.uploaderRow}>
            <Avatar uri={uploader.avatar} name={uploader.fullName} size={32} />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={styles.uploaderName} numberOfLines={1}>
                {uploader.fullName}
              </Text>
              <Text style={styles.date}>{formatMemoryDate(memory.createdAt)}</Text>
            </View>
            <View style={styles.likes}>
              <Ionicons name="heart" size={14} color="#fff" />
              <Text style={styles.likeCount}>{likes}</Text>
            </View>
          </View>
          {memory.caption ? (
            <Text style={[styles.caption, { fontSize: 13 * layout.fontScale }]} numberOfLines={2}>
              {memory.caption}
            </Text>
          ) : null}
        </View>
      </View>
    </DashboardPressable>
  );
}

function MemoryCarouselComponent({ memories, onMemoryPress, onViewAll }) {
  const { colors, layout, radii, isDark } = useTheme();
  const { horizontalPadding } = useResponsive();
  const { t } = useI18n();

  return (
    <Animated.View
      entering={FadeInDown.delay(140).duration(520).springify()}
      style={{ marginBottom: layout.sectionGap }}
    >
      <View style={{ paddingHorizontal: horizontalPadding }}>
        <SectionTitle
          title={t('dashboard.recentMemories')}
          subtitle={t('dashboard.recentMemoriesSubtitle')}
          actionLabel={memories.length ? t('common.viewAll') : undefined}
          onAction={memories.length ? onViewAll : undefined}
        />
      </View>

      {memories.length === 0 ? (
        <View style={{ paddingHorizontal: horizontalPadding }}>
          <View
            style={[
              styles.empty,
              {
                backgroundColor: colors.surfaceSecondary,
                borderRadius: radii['2xl'],
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="images-outline" size={36} color={colors.primary} />
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', marginTop: 12, fontSize: 16 * layout.fontScale }}>
              Your family story starts here
            </Text>
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 6, fontSize: 14 * layout.fontScale }}>
              Upload photos and videos to fill this carousel with shared moments.
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={STORY_WIDTH + 14}
          contentContainerStyle={[styles.scroll, { paddingHorizontal: horizontalPadding }]}
        >
          {memories.map((memory) => (
            <StoryCard
              key={String(memory._id)}
              memory={memory}
              onPress={onMemoryPress}
              colors={colors}
              layout={layout}
              radii={radii}
              isDark={isDark}
            />
          ))}
        </ScrollView>
      )}
    </Animated.View>
  );
}

export const MemoryCarousel = memo(MemoryCarouselComponent);

const styles = StyleSheet.create({
  scroll: { gap: 14, paddingBottom: 4 },
  story: { height: 320, overflow: 'hidden', backgroundColor: '#111' },
  media: { flex: 1 },
  image: { width: '100%', height: '100%' },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16 },
  uploaderRow: { flexDirection: 'row', alignItems: 'center' },
  uploaderName: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  date: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 1 },
  likes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  caption: { color: 'rgba(255,255,255,0.9)', marginTop: 10, lineHeight: 18 },
  empty: {
    alignItems: 'center',
    padding: 32,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
