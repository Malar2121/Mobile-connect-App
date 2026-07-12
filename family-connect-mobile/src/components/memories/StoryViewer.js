import React, { memo, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

function StoryViewerComponent({ memories, visible, initialIndex = 0, onClose }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [index, setIndex] = useState(initialIndex);
  const progress = useSharedValue(0);
  const timer = useRef(null);

  useEffect(() => {
    if (visible) {
      setIndex(initialIndex);
    }
  }, [visible, initialIndex]);

  const memory = memories?.[index];

  useEffect(() => {
    if (!visible || !memory) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: 5000 });
    timer.current = setTimeout(() => {
      if (index < memories.length - 1) setIndex((i) => i + 1);
      else onClose?.();
    }, 5200);
    return () => clearTimeout(timer.current);
  }, [visible, index, memory, memories?.length, onClose, progress]);

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  if (!visible || !memory) return null;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.bars}>
          {(memories ?? []).map((_, i) => (
            <View key={i} style={[styles.barTrack, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
              {i === index ? <Animated.View style={[styles.barFill, barStyle]} /> : i < index ? <View style={styles.barFill} /> : null}
            </View>
          ))}
        </View>
        <Pressable style={styles.close} onPress={onClose} accessibilityLabel="Close stories">
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        {memory.mediaType === 'video' ? (
          <Video source={{ uri: memory.mediaUrl }} style={styles.media} resizeMode={ResizeMode.CONTAIN} shouldPlay />
        ) : (
          <Image source={{ uri: memory.mediaUrl }} style={styles.media} contentFit="contain" />
        )}
        {memory.caption ? <Text style={styles.caption}>{memory.caption}</Text> : null}
        <Pressable style={styles.tapLeft} onPress={() => setIndex((i) => Math.max(0, i - 1))} />
        <Pressable style={styles.tapRight} onPress={() => (index < memories.length - 1 ? setIndex((i) => i + 1) : onClose?.())} />
      </View>
    </Modal>
  );
}

export const StoryViewer = memo(StoryViewerComponent);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  bars: { flexDirection: 'row', gap: 4, paddingHorizontal: 8, paddingBottom: 8 },
  barTrack: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 3, backgroundColor: '#fff' },
  close: { position: 'absolute', top: 48, right: 16, zIndex: 10 },
  media: { flex: 1, width: '100%' },
  caption: { color: '#fff', padding: 16, fontSize: 16, textAlign: 'center' },
  tapLeft: { position: 'absolute', left: 0, top: 80, bottom: 80, width: '40%' },
  tapRight: { position: 'absolute', right: 0, top: 80, bottom: 80, width: '40%' },
});
