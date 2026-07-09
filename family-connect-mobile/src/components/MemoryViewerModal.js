import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from './Avatar';
import { PrimaryButton } from './PrimaryButton';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import {
  canDeleteMemory,
  formatMemoryDate,
  getLikeCount,
  getUploader,
  isLikedByUser,
} from '../utils/memoryHelpers';

export function MemoryViewerModal({
  visible,
  memory,
  onClose,
  onLike,
  onDelete,
  liking,
  deleting,
}) {
  const { colors, layout, uiMode, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const videoRef = useRef(null);

  const isElder = uiMode === 'elder';
  const uploader = memory ? getUploader(memory) : null;
  const liked = memory ? isLikedByUser(memory, user?._id) : false;
  const likeCount = memory ? getLikeCount(memory) : 0;
  const showDelete = memory ? canDeleteMemory(memory, user) : false;
  const mediaHeight = Math.min(height * 0.52, width * 1.1);

  useEffect(() => {
    if (!visible && videoRef.current) {
      videoRef.current.pauseAsync().catch(() => {});
    }
  }, [visible]);

  function confirmDelete() {
    if (!memory || deleting) return;
    Alert.alert(
      'Delete memory',
      'This will permanently remove this memory for your family.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(memory),
        },
      ],
    );
  }

  if (!memory) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: isDark ? '#000' : colors.background }]}>
        <View
          style={[
            styles.topBar,
            {
              paddingTop: insets.top + 8,
              paddingHorizontal: layout.sectionGap,
            },
          ]}
        >
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="close" size={isElder ? 32 : 28} color={isDark ? '#fff' : colors.text} />
          </Pressable>
        </View>

        <ScrollView
          bounces={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + layout.sectionGap }}
        >
          <View style={[styles.mediaWrap, { height: mediaHeight }]}>
            {memory.mediaType === 'video' ? (
              <Video
                ref={videoRef}
                source={{ uri: memory.mediaUrl }}
                style={styles.media}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={visible}
              />
            ) : (
              <Image
                source={{ uri: memory.mediaUrl }}
                style={styles.media}
                resizeMode="contain"
              />
            )}
          </View>

          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                marginHorizontal: layout.sectionGap,
                marginTop: layout.sectionGap,
                padding: layout.sectionGap,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.uploaderRow}>
              <Avatar uri={uploader?.avatar} name={uploader?.fullName} size={isElder ? 48 : 40} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: '700',
                    fontSize: (isElder ? 18 : 16) * layout.fontScale,
                  }}
                >
                  {uploader?.fullName ?? 'Member'}
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    marginTop: 2,
                    fontSize: (isElder ? 14 : 13) * layout.fontScale,
                  }}
                >
                  {formatMemoryDate(memory.createdAt)}
                </Text>
              </View>
              <Pressable
                onPress={() => onLike?.(memory)}
                disabled={liking}
                style={({ pressed }) => [
                  styles.likeBtn,
                  {
                    borderColor: liked ? colors.primary : colors.border,
                    backgroundColor: liked
                      ? isDark
                        ? 'rgba(129,140,248,0.15)'
                        : 'rgba(99,102,241,0.1)'
                      : 'transparent',
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                {liking ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons
                      name={liked ? 'heart' : 'heart-outline'}
                      size={isElder ? 26 : 22}
                      color={liked ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={{
                        color: liked ? colors.primary : colors.textSecondary,
                        fontWeight: '700',
                        marginLeft: 6,
                        fontSize: (isElder ? 16 : 14) * layout.fontScale,
                      }}
                    >
                      {likeCount}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            {memory.caption ? (
              <Text
                style={{
                  color: colors.text,
                  marginTop: layout.sectionGap,
                  fontSize: (isElder ? 17 : 15) * layout.fontScale,
                  lineHeight: (isElder ? 24 : 22) * layout.fontScale,
                }}
              >
                {memory.caption}
              </Text>
            ) : null}

            {showDelete ? (
              <PrimaryButton
                title="Delete memory"
                onPress={confirmDelete}
                loading={deleting}
                disabled={deleting}
                style={[
                  {
                    marginTop: layout.sectionGap,
                    borderColor: colors.error,
                    backgroundColor: isDark ? 'rgba(248,113,113,0.12)' : 'rgba(239,68,68,0.08)',
                  },
                  isElder && { minHeight: layout.minTouch + 12 },
                ]}
                variant="secondary"
              />
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  closeBtn: {
    padding: 4,
  },
  mediaWrap: {
    width: '100%',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  sheet: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  uploaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 72,
    justifyContent: 'center',
  },
});
