import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatTypography } from '../../constants/chatTheme';
import { useTheme } from '../../hooks/useTheme';
import { getSender } from '../../utils/chatHelpers';

export function ChatPinnedBar({ message, editedTexts, onPress, onUnpin }) {
  const { colors, isDark } = useTheme();
  if (!message) return null;

  const text = editedTexts?.[String(message._id)] ?? message.text ?? '';
  const sender = getSender(message).fullName ?? 'Family';
  const preview = message.mediaUrl
    ? message.mediaType === 'video'
      ? '📹 Video'
      : '🖼️ Photo'
    : text;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.wrap,
        {
          backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
          borderColor: isDark ? 'rgba(129,140,248,0.25)' : 'rgba(99,102,241,0.2)',
        },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: colors.primary }]} />
      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.primary, fontFamily: chatTypography.fontFamilySemi }]}>
          Pinned message
        </Text>
        <Text style={[styles.preview, { color: colors.text }]} numberOfLines={1}>
          {sender}: {preview}
        </Text>
      </View>
      <Pressable onPress={onUnpin} hitSlop={8} style={styles.close}>
        <Ionicons name="close" size={18} color={colors.textSecondary} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  preview: {
    fontSize: 14,
  },
  close: {
    padding: 12,
  },
});
