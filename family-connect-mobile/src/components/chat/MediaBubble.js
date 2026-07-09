import React, { memo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

function MediaBubbleComponent({ uri, mediaType, isMine, onPress, hidden }) {
  const { colors } = useTheme();

  if (hidden) {
    return (
      <View style={[styles.hidden, { backgroundColor: isMine ? 'rgba(255,255,255,0.12)' : colors.surfaceSecondary }]}>
        <Ionicons name="eye-off-outline" size={18} color={isMine ? '#fff' : colors.textSecondary} />
      </View>
    );
  }

  return (
    <Pressable onPress={onPress} style={styles.wrap}>
      <Image source={{ uri }} style={styles.media} resizeMode="cover" />
      {mediaType === 'video' ? (
        <View style={styles.overlay}>
          <Ionicons name="play-circle" size={44} color="#fff" />
        </View>
      ) : null}
    </Pressable>
  );
}

export const MediaBubble = memo(MediaBubbleComponent);

const styles = StyleSheet.create({
  wrap: { marginBottom: 8, borderRadius: 16, overflow: 'hidden' },
  media: { width: 220, height: 160, borderRadius: 16, backgroundColor: '#ccc' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  hidden: { padding: 16, borderRadius: 14, marginBottom: 8, alignItems: 'center' },
});
