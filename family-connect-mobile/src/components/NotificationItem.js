import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { formatNotificationTime, getNotificationIcon } from '../utils/notificationHelpers';

export function NotificationItem({ notification, onPress, isElder }) {
  const { colors, layout, isDark } = useTheme();
  const unread = !notification.isRead;
  const icon = getNotificationIcon(notification.type);
  const titleSize = (isElder ? 17 : 15) * layout.fontScale;
  const bodySize = (isElder ? 15 : 14) * layout.fontScale;
  const metaSize = (isElder ? 13 : 12) * layout.fontScale;
  const rowPad = isElder ? 18 : 14;
  const iconSize = isElder ? 26 : 22;

  return (
    <Pressable
      onPress={() => onPress(notification)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: unread
            ? isDark
              ? 'rgba(129,140,248,0.12)'
              : 'rgba(99,102,241,0.08)'
            : colors.card,
          borderColor: colors.border,
          padding: rowPad,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: unread ? colors.primaryMuted : isDark ? colors.border : '#EEF2FF',
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={iconSize}
          color={unread ? colors.primary : colors.textSecondary}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            numberOfLines={2}
            style={{
              color: colors.text,
              fontWeight: unread ? '800' : '600',
              fontSize: titleSize,
              flex: 1,
              paddingRight: 8,
            }}
          >
            {notification.title}
          </Text>
          {unread ? <View style={[styles.badge, { backgroundColor: colors.primary }]} /> : null}
        </View>

        {notification.body ? (
          <Text
            numberOfLines={isElder ? 3 : 2}
            style={{
              color: colors.textSecondary,
              marginTop: 4,
              fontSize: bodySize,
              lineHeight: bodySize * 1.35,
            }}
          >
            {notification.body}
          </Text>
        ) : null}

        <Text
          style={{
            color: colors.textSecondary,
            marginTop: 8,
            fontSize: metaSize,
          }}
        >
          {formatNotificationTime(notification.createdAt)}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={styles.chev} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  chev: {
    marginLeft: 4,
  },
});
