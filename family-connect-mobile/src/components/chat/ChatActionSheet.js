import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { REACTION_EMOJIS } from '../../constants/chatTheme';
import { chatTypography } from '../../constants/chatTheme';
import { useTheme } from '../../hooks/useTheme';

const ACTIONS = [
  { id: 'reply', icon: 'arrow-undo', label: 'Reply' },
  { id: 'copy', icon: 'copy-outline', label: 'Copy' },
  { id: 'forward', icon: 'arrow-redo', label: 'Forward' },
  { id: 'edit', icon: 'create-outline', label: 'Edit' },
  { id: 'pin', icon: 'pin', label: 'Pin' },
  { id: 'star', icon: 'star-outline', label: 'Star' },
  { id: 'schedule', icon: 'time-outline', label: 'Schedule' },
  { id: 'delete', icon: 'trash-outline', label: 'Delete', danger: true },
];

export function ChatActionSheet({ visible, message, isMine, isPinned, isStarred, onClose, onAction, onReaction }) {
  const { colors, isDark } = useTheme();
  if (!message) return null;

  const handleAction = (id) => {
    Haptics.selectionAsync().catch(() => {});
    onAction?.(id, message);
    onClose?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      </Pressable>

      <View style={styles.sheetWrap} pointerEvents="box-none">
        <View style={[styles.reactions, { backgroundColor: isDark ? colors.card : '#fff' }]}>
          {REACTION_EMOJIS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => {
                onReaction?.(emoji);
                onClose?.();
              }}
              style={styles.reactionBtn}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.sheet, { backgroundColor: isDark ? colors.card : '#fff' }]}>
          {ACTIONS.filter((a) => (a.id === 'edit' || a.id === 'delete' ? isMine : true)).map((action) => (
            <Pressable
              key={action.id}
              onPress={() => handleAction(action.id)}
              style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.6 }]}
            >
              <Ionicons
                name={
                  action.id === 'pin' && isPinned
                    ? 'pin-outline'
                    : action.id === 'star' && isStarred
                      ? 'star'
                      : action.icon
                }
                size={22}
                color={action.danger ? colors.error : colors.text}
              />
              <Text
                style={[
                  styles.actionLabel,
                  {
                    color: action.danger ? colors.error : colors.text,
                    fontFamily: chatTypography.fontFamilySemi,
                  },
                ]}
              >
                {action.id === 'pin' && isPinned ? 'Unpin' : action.id === 'star' && isStarred ? 'Unstar' : action.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={onClose} style={[styles.cancel, { backgroundColor: isDark ? colors.card : '#fff' }]}>
          <Text style={[styles.cancelText, { color: colors.primary, fontFamily: chatTypography.fontFamilySemi }]}>
            Cancel
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  sheetWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 34,
  },
  reactions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    borderRadius: 22,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  reactionBtn: { padding: 6 },
  reactionEmoji: { fontSize: 26 },
  sheet: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  actionLabel: { fontSize: 16 },
  cancel: {
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cancelText: { fontSize: 16 },
});
