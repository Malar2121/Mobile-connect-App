import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { QUICK_EMOJIS, STICKERS, chatRadii, chatTypography } from '../../constants/chatTheme';
import { useTheme } from '../../hooks/useTheme';

export function ChatInputBar({
  draft,
  onChangeText,
  onSend,
  onAttach,
  onCamera,
  onVoiceStart,
  onVoiceEnd,
  sending,
  bottomInset,
}) {
  const { colors, isDark } = useTheme();
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const sendScale = useSharedValue(1);
  const hasText = Boolean(draft.trim());

  useEffect(() => {
    sendScale.value = withSpring(hasText ? 1 : 0.85, { damping: 14, stiffness: 200 });
  }, [hasText, sendScale]);

  const sendAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const appendEmoji = (emoji) => {
    onChangeText(draft + emoji);
    Haptics.selectionAsync().catch(() => {});
  };

  const handleSend = () => {
    if (!hasText || sending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSend();
  };

  const toggleRecord = () => {
    if (recording) {
      setRecording(false);
      onVoiceEnd?.();
    } else {
      setRecording(true);
      onVoiceStart?.();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(12, bottomInset) }]}>
      <BlurView intensity={isDark ? 50 : 70} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? 'rgba(30,36,48,0.95)' : 'rgba(255,255,255,0.95)',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        <Pressable onPress={() => setEmojiOpen((v) => !v)} style={styles.iconBtn}>
          <Ionicons name={emojiOpen ? 'keypad-outline' : 'happy-outline'} size={24} color={colors.primary} />
        </Pressable>

        <TextInput
          value={draft}
          onChangeText={onChangeText}
          placeholder="Message your family…"
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={2000}
          style={[
            styles.input,
            {
              color: colors.text,
              fontFamily: chatTypography.fontFamilyRegular,
              maxHeight: 120,
            },
          ]}
        />

        {!hasText ? (
          <>
            <Pressable onPress={onAttach} style={styles.iconBtn}>
              <Ionicons name="attach" size={24} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={onCamera} style={styles.iconBtn}>
              <Ionicons name="camera-outline" size={24} color={colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={toggleRecord}
              style={[styles.iconBtn, recording && { backgroundColor: 'rgba(239,68,68,0.15)' }]}
            >
              <Ionicons name={recording ? 'stop-circle' : 'mic-outline'} size={24} color={recording ? colors.error : colors.primary} />
            </Pressable>
          </>
        ) : (
          <Animated.View style={sendAnimStyle}>
            <Pressable
              onPress={handleSend}
              disabled={sending}
              style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: sending ? 0.6 : 1 }]}
            >
              <Ionicons name="arrow-up" size={22} color="#fff" />
            </Pressable>
          </Animated.View>
        )}
      </View>

      {emojiOpen ? (
        <View style={[styles.emojiPanel, { backgroundColor: isDark ? colors.card : '#fff' }]}>
          <Text style={[styles.emojiSection, { color: colors.textSecondary }]}>Emoji</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiRow}>
            {QUICK_EMOJIS.map((e) => (
              <Pressable key={e} onPress={() => appendEmoji(e)} style={styles.emojiBtn}>
                <Text style={styles.emoji}>{e}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={[styles.emojiSection, { color: colors.textSecondary }]}>Stickers</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiRow}>
            {STICKERS.map((e) => (
              <Pressable key={e} onPress={() => appendEmoji(e)} style={styles.emojiBtn}>
                <Text style={styles.emoji}>{e}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingTop: 8,
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    borderRadius: chatRadii.input,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 40,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiPanel: {
    marginTop: 8,
    borderRadius: 20,
    padding: 12,
  },
  emojiSection: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 4,
  },
  emojiRow: { gap: 4, paddingBottom: 4 },
  emojiBtn: { padding: 6 },
  emoji: { fontSize: 26 },
});
