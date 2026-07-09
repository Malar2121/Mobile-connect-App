import React, { memo, useCallback } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

function GalleryGridComponent({ memories, onPress, numColumns = 2 }) {
  const { colors, radii } = useTheme();
  const { horizontalPadding } = useResponsive();
  const { width } = useWindowDimensions();
  const gap = 8;
  const size = (width - horizontalPadding * 2 - gap * (numColumns - 1)) / numColumns;

  const renderItem = useCallback(
    ({ item }) => (
      <Pressable onPress={() => onPress?.(item)} style={{ width: size, marginBottom: gap }}>
        <View style={[styles.cell, { width: size, height: size, borderRadius: radii.lg, borderColor: colors.border }]}>
          <Image source={{ uri: item.mediaUrl }} style={styles.img} resizeMode="cover" />
          {item.mediaType === 'video' ? (
            <View style={styles.play}>
              <Ionicons name="play" size={24} color="#fff" />
            </View>
          ) : null}
        </View>
      </Pressable>
    ),
    [size, onPress, colors, radii],
  );

  return (
    <FlatList
      data={memories}
      keyExtractor={(item) => String(item._id)}
      renderItem={renderItem}
      numColumns={numColumns}
      columnWrapperStyle={{ gap }}
      contentContainerStyle={{ gap }}
      initialNumToRender={12}
      maxToRenderPerBatch={16}
      windowSize={9}
      removeClippedSubviews
    />
  );
}

export const GalleryGrid = memo(GalleryGridComponent);

const styles = StyleSheet.create({
  cell: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  img: { width: '100%', height: '100%' },
  play: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
});
