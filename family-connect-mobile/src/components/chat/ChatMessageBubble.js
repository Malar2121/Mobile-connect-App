import React, { useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Avatar } from '../Avatar';
import { ChatMediaContent } from './ChatMediaContent';
import { useTheme } from '../../hooks/useTheme';
import { chatGradients, chatRadii, chatTypography } from '../../constants/chatTheme';
import {
  formatMessageTime,
  getOutgoingStatus,
  getSender,
  getSeenByLabel,
  highlightSearchText,
} from '../../utils/chatHelpers';

function StatusIcon({ status, size }) {
  if (status === 'sending') {
    return <ActivityIndicator size="small" color="rgba(255,255,255,0.85)" style={{ marginLeft: 4 }} />;
  }
  const props = { size, style: { marginLeft: 4 } };
  if (status === 'seen') return <Ionicons name="checkmark-done" {...props} color="#BFDBFE" />;
  if (status === 'delivered') return <Ionicons name="checkmark-done" {...props} color="rgba(255,255,255,0.75)" />;
  return <Ionicons name="checkmark" {...props} color="rgba(255,255,255,0.75)" />;
}

function ReactionRow({ reactions, onReactionPress }) {
  if (!reactions?.length) return null;
  const grouped = reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <View style={styles.reactions}>
      {Object.entries(grouped).map(([emoji, count]) => (
        <Pressable key={emoji} onPress={() => onReactionPress?.(emoji)} style={styles.reactionChip}>
          <Text style={styles.reactionEmoji}>
            {emoji}
            {count > 1 ? ` ${count}` : ''}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function ChatMessageBubble({
  message,
  isMine,
  userId,
  familyMemberCount,
  showAvatar,
  editedTexts,
  reactions,
  isStarred,
  searchQuery,
  replyToMessage,
  onLongPress,
  onSwipeReply,
  onReactionPress,
  uiMode,
}) {
  const { colors, isDark } = useTheme();
  const sender = getSender(message);
  const status = isMine ? getOutgoingStatus(message, userId, familyMemberCount) : null;
  const seenLabel = isMine ? getSeenByLabel(message, userId, familyMemberCount) : null;
  const displayText = editedTexts?.[String(message._id)] ?? message.text ?? '';
  const isEdited = Boolean(message.editedAt || editedTexts?.[String(message._id)]);
  const translateX = useSharedValue(0);
  const longPressTriggered = useRef(false);

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, []);

  const pan = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((e) => {
      const clamped = Math.max(-72, Math.min(72, e.translationX));
      translateX.value = isMine ? Math.min(0, clamped) : Math.max(0, clamped);
    })
    .onEnd((e) => {
      const threshold = 48;
      const shouldReply = isMine ? e.translationX < -threshold : e.translationX > threshold;
      if (shouldReply && onSwipeReply) {
        runOnJS(onSwipeReply)(message);
        runOnJS(triggerHaptic)();
      }
      translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
    });

  const longPress = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      longPressTriggered.current = true;
      runOnJS(triggerHaptic)();
      if (onLongPress) runOnJS(onLongPress)(message);
    });

  const tap = Gesture.Tap().onEnd(() => {
    longPressTriggered.current = false;
  });

  const gesture = Gesture.Simultaneous(pan, Gesture.Exclusive(longPress, tap));

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const textParts = searchQuery ? highlightSearchText(displayText, searchQuery) : null;
  const gradientColors = isDark ? chatGradients.sentDark : chatGradients.sent;

  const bubbleContent = (
  <>
      {replyToMessage ? (
        <View
          style={[
            styles.replyPreview,
            {
              backgroundColor: isMine ? 'rgba(255,255,255,0.15)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            },
          ]}
        >
          <Text
            style={{
              color: isMine ? '#E0E7FF' : colors.primary,
              fontSize: 12,
              fontFamily: chatTypography.fontFamilySemi,
            }}
          >
            {getSender(replyToMessage).fullName}
          </Text>
          <Text
            style={{
              color: isMine ? 'rgba(255,255,255,0.8)' : colors.textSecondary,
              fontSize: 12,
            }}
            numberOfLines={2}
          >
            {replyToMessage.text || 'Media'}
          </Text>
        </View>
      ) : null}

      <ChatMediaContent message={message} isMine={isMine} uiMode={uiMode} />

      {displayText ? (
        <Text
          style={{
            color: isMine ? '#FFFFFF' : colors.text,
            fontSize: uiMode === 'minor' ? 20 : 16,
            lineHeight: uiMode === 'minor' ? 28 : 22,
            fontFamily: chatTypography.fontFamilyRegular,
          }}
        >
          {textParts
            ? textParts.map((part, i) => (
                <Text
                  key={i}
                  style={part.highlight ? { backgroundColor: 'rgba(250,204,21,0.45)', borderRadius: 4 } : undefined}
                >
                  {part.text}
                </Text>
              ))
            : displayText}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        {isEdited ? (
          <Text style={[styles.edited, { color: isMine ? 'rgba(255,255,255,0.65)' : colors.textSecondary }]}>
            edited
          </Text>
        ) : null}
        <Text
          style={{
            color: isMine ? 'rgba(255,255,255,0.72)' : colors.textSecondary,
            fontSize: 11,
          }}
        >
          {formatMessageTime(message.createdAt)}
        </Text>
        {isMine ? (
          <View style={styles.statusRow}>
            {seenLabel ? (
              <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11, marginLeft: 6 }}>
                {seenLabel}
              </Text>
            ) : null}
            <StatusIcon status={status} size={14} />
          </View>
        ) : null}
        {isStarred ? <Ionicons name="star" size={12} color={isMine ? '#FDE68A' : '#F59E0B'} style={{ marginLeft: 4 }} /> : null}
      </View>
    </>
  );

  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
      {!isMine && showAvatar ? (
        <Avatar uri={sender.avatar} name={sender.fullName} size={32} />
      ) : !isMine ? (
        <View style={{ width: 32 }} />
      ) : null}

      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.bubbleCol, isMine && styles.bubbleColMine, animStyle]}>
          {!isMine ? (
            <Text style={[styles.senderName, { color: colors.textSecondary, fontFamily: chatTypography.fontFamilySemi, fontSize: uiMode === 'minor' ? 14 : 12 }]}>
              {sender.fullName ?? 'Family'}
            </Text>
          ) : null}

          {isMine ? (
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.bubble, styles.bubbleMine, { borderRadius: uiMode === 'minor' ? 24 : chatRadii.bubble }]}
            >
              {bubbleContent}
            </LinearGradient>
          ) : (
            <View
              style={[
                styles.bubble,
                {
                  borderRadius: uiMode === 'minor' ? 24 : chatRadii.bubble,
                  backgroundColor: isDark ? '#1E2430' : (uiMode === 'minor' ? '#E0F2FE' : '#F0F2F5'),
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderWidth: StyleSheet.hairlineWidth,
                },
              ]}
            >
              {bubbleContent}
            </View>
          )}

          <ReactionRow reactions={reactions} onReactionPress={onReactionPress} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubbleCol: { maxWidth: '82%', flexShrink: 1 },
  bubbleColMine: { alignItems: 'flex-end' },
  senderName: { fontSize: 12, marginBottom: 4, marginLeft: 6 },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '100%',
  },
  bubbleMine: {
    overflow: 'hidden',
  },
  replyPreview: {
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255,255,255,0.5)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
    flexWrap: 'wrap',
    gap: 2,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  edited: { fontSize: 11, fontStyle: 'italic', marginRight: 4 },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
    marginLeft: 4,
  },
  reactionChip: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  reactionEmoji: { fontSize: 13 },
});
