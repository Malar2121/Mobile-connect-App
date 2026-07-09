import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useTheme } from '../../hooks/useTheme';

import { VoiceBubble } from './VoiceBubble';
import { shouldHidePreview, getPreviewLabel } from '../../utils/chatModuleHelpers';

export function ChatMediaContent({ message, isMine, uiMode }) {
  const { colors } = useTheme();
  const [playing, setPlaying] = useState(false);
  const hidden = shouldHidePreview(message, uiMode);

  if (hidden) {
    return (
      <View style={[styles.docRow, { backgroundColor: isMine ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.04)' }]}>
        <Ionicons name="eye-off-outline" size={18} color={isMine ? '#fff' : colors.textSecondary} />
        <Text style={{ color: isMine ? '#fff' : colors.textSecondary, fontSize: 13 }}>{getPreviewLabel(message, uiMode)}</Text>
      </View>
    );
  }

  if (!message?.mediaUrl) {
    if (message?.mediaType === 'audio' || message?.localAudio) {
      return <VoiceBubble uri={message.mediaUrl || message.localAudio} duration={message.mediaDuration} isMine={isMine} />;
    }

    if (message?.documentName) {
      return (
        <View style={[styles.docRow, { backgroundColor: isMine ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.04)' }]}>
          <Ionicons name="document-text" size={22} color={isMine ? '#fff' : colors.primary} />
          <Text style={{ color: isMine ? '#fff' : colors.text, flex: 1 }} numberOfLines={1}>
            {message.documentName}
          </Text>
        </View>
      );
    }
    return null;
  }

  if (message.mediaType === 'audio') {
    return <VoiceBubble uri={message.mediaUrl} duration={message.mediaDuration} isMine={isMine} />;
  }

  if (message.mediaType === 'video') {
    return (
      <View style={styles.mediaWrap}>
        {playing ? (
          <Video
            source={{ uri: message.mediaUrl }}
            style={styles.media}
            useNativeControls
            resizeMode={ResizeMode.COVER}
            shouldPlay
          />
        ) : (
          <Pressable onPress={() => setPlaying(true)}>
            <Image source={{ uri: message.mediaUrl }} style={styles.media} resizeMode="cover" />
            <View style={styles.playOverlay}>
              <Ionicons name="play-circle" size={48} color="#fff" />
            </View>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <Image source={{ uri: message.mediaUrl }} style={styles.media} resizeMode="cover" />
  );
}

const styles = StyleSheet.create({
  mediaWrap: {
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  media: {
    width: 220,
    height: 160,
    borderRadius: 16,
    backgroundColor: '#ccc',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    marginBottom: 8,
    minWidth: 180,
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 28,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    minWidth: 180,
  },
});
