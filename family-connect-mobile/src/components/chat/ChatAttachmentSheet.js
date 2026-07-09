import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { chatTypography } from '../../constants/chatTheme';
import { useTheme } from '../../hooks/useTheme';

const OPTIONS = [
  { id: 'gallery', icon: 'images-outline', label: 'Photo & Video', color: '#8B5CF6' },
  { id: 'camera', icon: 'camera-outline', label: 'Camera', color: '#EC4899' },
  { id: 'document', icon: 'document-outline', label: 'Document', color: '#3B82F6' },
  { id: 'gif', icon: 'happy-outline', label: 'GIF', color: '#F59E0B' },
];

export function ChatAttachmentSheet({ visible, onClose, onSelect }) {
  const { colors, isDark } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      </Pressable>
      <View style={styles.sheet}>
        <View style={[styles.card, { backgroundColor: isDark ? colors.card : '#fff' }]}>
          {OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              onPress={() => {
                onSelect?.(opt.id);
                onClose?.();
              }}
              style={styles.option}
            >
              <View style={[styles.icon, { backgroundColor: `${opt.color}18` }]}>
                <Ionicons name={opt.icon} size={24} color={opt.color} />
              </View>
              <Text style={[styles.label, { color: colors.text, fontFamily: chatTypography.fontFamilyRegular }]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  sheet: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  option: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: { fontSize: 14 },
});
