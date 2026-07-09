import React, { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getAlbumCoverUri } from '../../utils/memoryModuleHelpers';

function AlbumCardComponent({ album, onPress }) {
  const { colors, layout, radii, shadows } = useTheme();
  const cover = getAlbumCoverUri(album);

  return (
    <Pressable onPress={() => onPress?.(album)} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1, marginBottom: 12 }]}>
      <View style={[styles.wrap, shadows.sm, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl }]}>
        {cover ? (
          <Image source={{ uri: cover }} style={[styles.cover, { borderRadius: radii.lg }]} />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: colors.primarySubtle, borderRadius: radii.lg }]}>
            <Ionicons name="albums-outline" size={32} color={colors.primary} />
          </View>
        )}
        <View style={styles.body}>
          <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 16 * layout.fontScale }} numberOfLines={1}>
            {album.title}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
            {album.mediaCount ?? 0} items
            {album.isShared ? ' · Shared' : ''}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export const AlbumCard = memo(AlbumCardComponent);

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', padding: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  cover: { width: 64, height: 64 },
  placeholder: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, marginLeft: 14 },
});
