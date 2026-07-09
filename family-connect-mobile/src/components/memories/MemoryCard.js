import React, { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { formatMemoryDate, getLikeCount, getUploader } from '../../utils/memoryHelpers';

function MemoryCardComponent({ memory, onPress, compact }) {
  const { colors, layout, radii } = useTheme();
  const uploader = getUploader(memory);
  const isVideo = memory.mediaType === 'video';
  const thumbSize = compact ? 72 : 88;

  return (
    <Pressable onPress={() => onPress?.(memory)} accessibilityRole="button" accessibilityLabel={memory.caption || 'Memory'}>
      <View style={[styles.row, { marginBottom: compact ? 8 : 12 }]}>
        <View style={[styles.thumb, { width: thumbSize, height: thumbSize, borderRadius: radii.lg, borderColor: colors.border }]}>
          <Image source={{ uri: memory.mediaUrl }} style={styles.image} resizeMode="cover" />
          {isVideo ? (
            <View style={styles.play}>
              <Ionicons name="play" size={16} color="#fff" />
            </View>
          ) : null}
        </View>
        <View style={styles.body}>
          <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 15 * layout.fontScale }} numberOfLines={2}>
            {memory.caption || (isVideo ? 'Video memory' : 'Photo memory')}
          </Text>
          <View style={styles.meta}>
            <Avatar uri={uploader.avatar} name={uploader.fullName} size={20} />
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 6 }}>{uploader.fullName}</Text>
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 4 }}>
            {formatMemoryDate(memory.createdAt)} · {getLikeCount(memory)} likes
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export const MemoryCard = memo(MemoryCardComponent);

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  thumb: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  image: { width: '100%', height: '100%' },
  play: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
});
