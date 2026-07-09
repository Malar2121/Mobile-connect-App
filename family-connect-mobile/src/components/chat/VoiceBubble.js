import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useTheme } from '../../hooks/useTheme';
import { formatDuration } from '../../utils/chatModuleHelpers';

const SPEEDS = [1, 1.5, 2];

function VoiceBubbleComponent({ uri, duration, isMine }) {
  const { colors } = useTheme();
  const soundRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [total, setTotal] = useState(duration ?? 0);
  const [speedIdx, setSpeedIdx] = useState(0);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync?.().catch(() => {});
    };
  }, []);

  const togglePlay = useCallback(async () => {
    if (!uri) return;
    try {
      if (playing && soundRef.current) {
        await soundRef.current.pauseAsync();
        setPlaying(false);
        return;
      }
      if (!soundRef.current) {
        const { sound, status } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true, rate: SPEEDS[speedIdx], shouldCorrectPitch: true },
          (s) => {
            if (s.isLoaded) {
              setPosition((s.positionMillis ?? 0) / 1000);
              setTotal((s.durationMillis ?? 0) / 1000 || duration || 0);
              if (s.didJustFinish) {
                setPlaying(false);
                setPosition(0);
              }
            }
          },
        );
        soundRef.current = sound;
        if (status?.durationMillis) setTotal(status.durationMillis / 1000);
        setPlaying(true);
      } else {
        await soundRef.current.playAsync();
        setPlaying(true);
      }
    } catch {
      setPlaying(false);
    }
  }, [uri, playing, speedIdx, duration]);

  const cycleSpeed = useCallback(async () => {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    if (soundRef.current) {
      await soundRef.current.setRateAsync(SPEEDS[next], true).catch(() => {});
    }
  }, [speedIdx]);

  const progress = total > 0 ? Math.min(1, position / total) : 0;

  return (
    <View style={[styles.row, { backgroundColor: isMine ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.04)' }]}>
      <Pressable onPress={togglePlay} accessibilityLabel={playing ? 'Pause voice message' : 'Play voice message'}>
        <Ionicons name={playing ? 'pause' : 'play'} size={22} color={isMine ? '#fff' : colors.primary} />
      </Pressable>
      <View style={styles.waveform}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height: 6 + (i % 6) * 3,
                opacity: i / 20 <= progress ? 1 : 0.35,
                backgroundColor: isMine ? 'rgba(255,255,255,0.8)' : colors.primary,
              },
            ]}
          />
        ))}
      </View>
      <Text style={{ color: isMine ? '#fff' : colors.textSecondary, fontSize: 11, minWidth: 36 }}>
        {formatDuration(playing ? position : total)}
      </Text>
      <Pressable onPress={cycleSpeed} accessibilityLabel="Change playback speed">
        <Text style={{ color: isMine ? '#E0E7FF' : colors.primary, fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>
          {SPEEDS[speedIdx]}x
        </Text>
      </Pressable>
    </View>
  );
}

export const VoiceBubble = memo(VoiceBubbleComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 14,
    marginBottom: 8,
    minWidth: 200,
  },
  waveform: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 28 },
  bar: { width: 3, borderRadius: 2 },
});
