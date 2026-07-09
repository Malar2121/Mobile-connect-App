import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { useTheme } from '../hooks/useTheme';
import { formatMessageTime, getOutgoingStatus, getSender } from '../utils/chatHelpers';

function StatusIcon({ status, colors, size }) {
  if (status === 'sending') {
    return <ActivityIndicator size="small" color="rgba(255,255,255,0.85)" style={{ marginLeft: 4 }} />;
  }

  const iconProps = { size, style: { marginLeft: 4 } };

  if (status === 'seen') {
    return <Ionicons name="checkmark-done" {...iconProps} color="#93C5FD" />;
  }
  if (status === 'delivered') {
    return <Ionicons name="checkmark-done" {...iconProps} color="rgba(255,255,255,0.75)" />;
  }
  return <Ionicons name="checkmark" {...iconProps} color="rgba(255,255,255,0.75)" />;
}

export function MessageBubble({ message, isMine, userId, familyMemberCount, showAvatar }) {
  const { colors, layout, uiMode, isDark } = useTheme();
  const isElder = uiMode === 'elder';
  const sender = getSender(message);
  const status = isMine ? getOutgoingStatus(message, userId, familyMemberCount) : null;
  const statusLabel =
    status === 'seen'
      ? 'Seen'
      : status === 'delivered'
        ? 'Delivered'
        : status === 'sent'
          ? 'Sent'
          : null;

  const bubblePad = isElder ? 16 : 12;
  const fontSize = (isElder ? 17 : 15) * layout.fontScale;
  const metaSize = (isElder ? 12 : 11) * layout.fontScale;
  const avatarSize = isElder ? 40 : 32;
  const iconSize = isElder ? 16 : 14;

  const mineBg = colors.primary;
  const theirsBg = isDark ? colors.card : '#FFFFFF';
  const theirsBorder = colors.border;

  return (
    <View
      style={[
        styles.row,
        isMine ? styles.rowMine : styles.rowTheirs,
        { marginBottom: isElder ? 14 : 10 },
      ]}
    >
      {!isMine && showAvatar ? (
        <Avatar uri={sender.avatar} name={sender.fullName} size={avatarSize} />
      ) : !isMine ? (
        <View style={{ width: avatarSize }} />
      ) : null}

      <View style={[styles.bubbleCol, isMine ? styles.bubbleColMine : styles.bubbleColTheirs]}>
        {!isMine ? (
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: metaSize,
              fontWeight: '600',
              marginBottom: 4,
              marginLeft: 4,
            }}
          >
            {sender.fullName ?? 'Family'}
          </Text>
        ) : null}

        <View
          style={[
            styles.bubble,
            {
              paddingHorizontal: bubblePad,
              paddingVertical: bubblePad - 2,
              backgroundColor: isMine ? mineBg : theirsBg,
              borderColor: isMine ? mineBg : theirsBorder,
              borderWidth: isMine ? 0 : StyleSheet.hairlineWidth,
              maxWidth: isElder ? '88%' : '85%',
              borderBottomRightRadius: isMine ? 6 : 18,
              borderBottomLeftRadius: isMine ? 18 : 6,
            },
          ]}
        >
          <Text
            style={{
              color: isMine ? '#FFFFFF' : colors.text,
              fontSize,
              lineHeight: fontSize * 1.35,
            }}
          >
            {message.text}
          </Text>

          <View style={styles.metaRow}>
            <Text
              style={{
                color: isMine ? 'rgba(255,255,255,0.72)' : colors.textSecondary,
                fontSize: metaSize,
              }}
            >
              {formatMessageTime(message.createdAt)}
            </Text>
            {isMine ? (
              <View style={styles.statusRow}>
                {statusLabel ? (
                  <Text
                    style={{
                      color: 'rgba(255,255,255,0.72)',
                      fontSize: metaSize,
                      marginLeft: 6,
                    }}
                  >
                    {statusLabel}
                  </Text>
                ) : null}
                <StatusIcon status={status} colors={colors} size={iconSize} />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  rowMine: {
    justifyContent: 'flex-end',
  },
  rowTheirs: {
    justifyContent: 'flex-start',
  },
  bubbleCol: {
    flexShrink: 1,
  },
  bubbleColMine: {
    alignItems: 'flex-end',
  },
  bubbleColTheirs: {
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
    flexWrap: 'wrap',
    gap: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
