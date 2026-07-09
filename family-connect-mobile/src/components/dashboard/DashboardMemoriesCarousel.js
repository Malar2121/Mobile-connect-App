import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { DashboardEmptyIllustration } from './DashboardEmptyIllustration';
import { DashboardPressable } from './DashboardPressable';
import { useTheme } from '../../hooks/useTheme';
import {
  dashboardGradients,
  dashboardRadii,
  dashboardShadows,
  dashboardSpacing,
  dashboardTypography,
} from '../../constants/dashboardTheme';

function formatMemoryDate(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function MemoryTile({ memory, isDark, colors }) {
  const likeCount = Array.isArray(memory.likes) ? memory.likes.length : 0;
  const gradients = dashboardGradients(isDark);

  return (
    <View style={[styles.tile, dashboardShadows.soft]}>
      <View style={styles.thumbWrap}>
        {memory.mediaType === 'video' ? (
          <LinearGradient colors={gradients.cool} style={styles.thumb}>
            <Ionicons name="play-circle" size={36} color="#fff" />
          </LinearGradient>
        ) : (
          <Image source={{ uri: memory.mediaUrl }} style={styles.thumb} />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={styles.thumbOverlay}
        />
        <View style={styles.likesRow}>
          <Ionicons name="heart" size={12} color="#fff" />
          <Text style={styles.likesText}>{likeCount}</Text>
        </View>
      </View>
      <Text
        style={{
          color: colors.text,
          fontFamily: dashboardTypography.fontSemi,
          fontSize: 13,
          marginTop: 8,
        }}
        numberOfLines={1}
      >
        {memory.caption || memory.uploadedBy?.fullName || 'Memory'}
      </Text>
      <Text
        style={{
          color: colors.textSecondary,
          fontFamily: dashboardTypography.fontRegular,
          fontSize: 12,
          marginTop: 2,
        }}
      >
        {formatMemoryDate(memory.createdAt)}
      </Text>
    </View>
  );
}

export function DashboardMemoriesCarousel({ memories, onViewAll }) {
  const { colors, isDark } = useTheme();

  return (
    <Animated.View entering={FadeInDown.delay(220).duration(520).springify()} style={styles.section}>
      <View style={styles.head}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: dashboardTypography.fontSemi }]}>
          Recent memories
        </Text>
        {memories.length > 0 ? (
          <DashboardPressable onPress={onViewAll}>
            <Text style={{ color: colors.primary, fontFamily: dashboardTypography.fontMedium, fontSize: 14 }}>
              View all
            </Text>
          </DashboardPressable>
        ) : null}
      </View>

      {memories.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.04)' }]}>
          <DashboardEmptyIllustration
            compact
            icon="images-outline"
            title="No memories yet"
            message="Capture your first family photo or video to fill this carousel."
            gradient={dashboardGradients(isDark).warm}
          />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {memories.map((mem) => (
            <MemoryTile key={String(mem._id)} memory={mem} isDark={isDark} colors={colors} />
          ))}
        </ScrollView>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: dashboardSpacing.lg,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: dashboardSpacing.sm,
    paddingHorizontal: dashboardSpacing.screen,
  },
  sectionTitle: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  scroll: {
    paddingHorizontal: dashboardSpacing.screen,
    gap: 14,
    paddingBottom: 4,
  },
  tile: {
    width: 148,
  },
  thumbWrap: {
    borderRadius: dashboardRadii.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  thumb: {
    width: 148,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ccc',
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  likesRow: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likesText: {
    color: '#fff',
    fontFamily: dashboardTypography.fontSemi,
    fontSize: 12,
  },
  emptyCard: {
    marginHorizontal: dashboardSpacing.screen,
    borderRadius: dashboardRadii.lg,
    overflow: 'hidden',
  },
});
