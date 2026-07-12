import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import { Avatar } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { formatMemoryDate, getLikeCount, getUploader } from '../../utils/memoryHelpers';

function MemoryHeroComponent({ memory, viewCount }) {
  const { colors, layout, radii, isDark } = useTheme();
  const uploader = getUploader(memory);
  const isVideo = memory.mediaType === 'video';

  return (
    <View style={[styles.wrap, { borderRadius: radii['2xl'], overflow: 'hidden' }]}>
      {isVideo ? (
        <Video source={{ uri: memory.mediaUrl }} style={styles.media} useNativeControls resizeMode={ResizeMode.CONTAIN} />
      ) : (
        <Image source={{ uri: memory.mediaUrl }} style={styles.media} contentFit="cover" accessibilityLabel="Memory photo" />
      )}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.overlay}>
        {memory.caption ? (
          <Text style={{ color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 20 * layout.fontScale }}>{memory.caption}</Text>
        ) : null}
        <View style={styles.meta}>
          <Avatar uri={uploader.avatar} name={uploader.fullName} size={32} />
          <Text style={{ color: 'rgba(255,255,255,0.9)', marginLeft: 8, fontSize: 14 }}>{uploader.fullName}</Text>
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 6 }}>
          {formatMemoryDate(memory.createdAt)} · {getLikeCount(memory)} likes
          {viewCount ? ` · ${viewCount} views` : ''}
        </Text>
      </LinearGradient>
    </View>
  );
}

export const MemoryHero = memo(MemoryHeroComponent);

const styles = StyleSheet.create({
  wrap: { minHeight: 320 },
  media: { width: '100%', height: 320 },
  overlay: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
});
