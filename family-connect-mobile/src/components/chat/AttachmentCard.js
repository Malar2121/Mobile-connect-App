import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

const ICONS = {
  gallery: 'images-outline',
  camera: 'camera-outline',
  document: 'document-text-outline',
  gif: 'film-outline',
};

function AttachmentCardComponent({ type, label, description, onPress }) {
  const { colors, layout, radii } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl, opacity: pressed ? 0.9 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.icon, { backgroundColor: colors.primarySubtle, borderRadius: radii.md }]}>
        <Ionicons name={ICONS[type] ?? 'attach-outline'} size={24} color={colors.primary} />
      </View>
      <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 15 * layout.fontScale, marginTop: 10 }}>{label}</Text>
      {description ? <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>{description}</Text> : null}
    </Pressable>
  );
}

export const AttachmentCard = memo(AttachmentCardComponent);

const styles = StyleSheet.create({
  card: { width: '47%', padding: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  icon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
});
