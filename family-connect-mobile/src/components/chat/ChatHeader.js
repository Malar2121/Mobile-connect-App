import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FamilyAvatarGroup } from './FamilyAvatarGroup';
import { useTheme } from '../../hooks/useTheme';
import { chatTypography } from '../../constants/chatTheme';

function HeaderButton({ icon, onPress, colors, isDark }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconBtn,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.08)',
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      hitSlop={6}
    >
      <Ionicons name={icon} size={20} color={colors.primary} />
    </Pressable>
  );
}

export function ChatHeader({
  familyName,
  members,
  onlineCount,
  onVoiceCall,
  onVideoCall,
  onSearch,
  onMore,
  onBack,
  showBack,
}) {
  const { colors, isDark, uiMode } = useTheme();
  const insets = useSafeAreaInsets();
  const memberTotal = members?.length ?? 0;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 6 }]}>
      <BlurView
        intensity={isDark ? 60 : 80}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.inner,
          {
            borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          },
        ]}
      >
        <View style={styles.left}>
          {showBack ? (
            <Pressable onPress={onBack} hitSlop={8} accessibilityLabel="Go back">
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </Pressable>
          ) : null}
          <FamilyAvatarGroup members={members} size={40} />
          <View style={styles.meta}>
            <Text
              style={[
                styles.title,
                { color: colors.text, fontFamily: chatTypography.fontFamilyBold },
              ]}
              numberOfLines={1}
            >
              {familyName || 'Family'}
            </Text>
            <View style={styles.statusRow}>
              <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {onlineCount} online · {memberTotal} members
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <HeaderButton icon="call-outline" onPress={onVoiceCall} colors={colors} isDark={isDark} />
          <HeaderButton icon="videocam-outline" onPress={onVideoCall} colors={colors} isDark={isDark} />
          {uiMode !== 'minor' && (
            <>
              <HeaderButton icon="search-outline" onPress={onSearch} colors={colors} isDark={isDark} />
              <HeaderButton icon="ellipsis-horizontal" onPress={onMore} colors={colors} isDark={isDark} />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 8,
  },
  meta: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: chatTypography.fontFamilyRegular,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
