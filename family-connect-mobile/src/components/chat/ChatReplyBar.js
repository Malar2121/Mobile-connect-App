import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatTypography } from '../../constants/chatTheme';
import { useTheme } from '../../hooks/useTheme';
import { getSender } from '../../utils/chatHelpers';
import { useI18n } from '../../i18n';

export function ChatReplyBar({ message, editedTexts, onClose }) {
  const { t } = useI18n();
  const { colors, isDark } = useTheme();
  if (!message) return null;

  const text = editedTexts?.[String(message._id)] ?? message.text ?? '';
  const sender = getSender(message).fullName ?? t('profile.family');

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: isDark ? colors.card : '#fff',
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: colors.primary }]} />
      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.primary, fontFamily: chatTypography.fontFamilySemi }]}>
          {t('chat.replyingTo', { name: sender })}
        </Text>
        <Text style={[styles.preview, { color: colors.textSecondary }]} numberOfLines={2}>
          {text || (message.mediaUrl ? t('chat.media') : '')}
        </Text>
      </View>
      <Pressable onPress={onClose} hitSlop={8} style={styles.close}>
        <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 18,
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
    fontSize: 12,
    marginBottom: 2,
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
  },
  close: {
    padding: 12,
  },
});
