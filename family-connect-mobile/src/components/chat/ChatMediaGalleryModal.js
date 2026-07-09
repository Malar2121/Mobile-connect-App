import React from 'react';
import { FlatList, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chatTypography } from '../../constants/chatTheme';
import { useTheme } from '../../hooks/useTheme';

export function ChatMediaGalleryModal({ visible, mediaMessages, onClose }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text, fontFamily: chatTypography.fontFamilyBold }]}>
            Shared media
          </Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
        </View>

        <FlatList
          data={mediaMessages}
          numColumns={3}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={{ padding: 8 }}
          ListEmptyComponent={
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 60 }}>
              No shared photos or videos yet
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <Image source={{ uri: item.mediaUrl }} style={styles.thumb} resizeMode="cover" />
              {item.mediaType === 'video' ? (
                <View style={styles.videoBadge}>
                  <Ionicons name="play" size={14} color="#fff" />
                </View>
              ) : null}
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: { fontSize: 22 },
  cell: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 4,
    position: 'relative',
  },
  thumb: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#ccc',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    padding: 4,
  },
});
