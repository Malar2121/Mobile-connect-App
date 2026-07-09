import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { chatShadows } from '../../constants/chatTheme';
import { useTheme } from '../../hooks/useTheme';

export function ChatScrollFab({ visible, onPress, unreadCount = 0 }) {
  const { colors, isDark } = useTheme();
  if (!visible) return null;

  return (
    <Animated.View entering={FadeInDown.springify()} exiting={FadeOutDown} style={styles.wrap}>
      <Pressable
        onPress={onPress}
        style={[
          styles.fab,
          chatShadows.fab,
          { backgroundColor: isDark ? colors.card : '#fff' },
        ]}
      >
        <Ionicons name="chevron-down" size={22} color={colors.primary} />
        {unreadCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    zIndex: 10,
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
