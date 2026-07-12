import React, { useCallback, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader, Screen, SectionTitle, FAB } from '../../design-system';
import { useChatModule } from '../../contexts/ChatModuleContext';
import { ChatSkeleton } from '../../components/chat/ChatSkeleton';
import { PinnedBanner } from '../../components/chat/PinnedBanner';
import { getChatAnalytics } from '../../utils/chatModuleHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

const SHORTCUTS = [
  { id: 'conversation', label: 'Open chat', icon: 'chatbubbles', screen: 'Conversation', primary: true },
  { id: 'search', label: 'Search', icon: 'search', screen: 'ChatSearch' },
  { id: 'media', label: 'Media', icon: 'images', screen: 'ChatMediaGallery' },
  { id: 'files', label: 'Files', icon: 'folder', screen: 'SharedFiles' },
  { id: 'pinned', label: 'Pinned', icon: 'pin', screen: 'PinnedMessages' },
  { id: 'starred', label: 'Starred', icon: 'star', screen: 'StarredMessages' },
  { id: 'voice', label: 'Voice', icon: 'mic', screen: 'VoiceMessage' },
  { id: 'settings', label: 'Settings', icon: 'settings', screen: 'ChatSettings' },
];

export default function ChatHomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();
  const { colors, layout, radii, isDark } = useTheme();
  const { family, members, messages, loading, pinnedMessage, prefs, typingName, loadHistory } = useChatModule();

  const analytics = useMemo(() => getChatAnalytics(messages, members), [messages, members]);
  const navigate = useCallback((screen) => navigation.navigate(screen), [navigation]);

  if (loading && !messages.length) {
    return (
      <Screen edges={['top']}>
        <PageHeader title="Chat" subtitle="Family communication" large />
        <ChatSkeleton />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} noPadding>
      <View style={{ paddingHorizontal: horizontalPadding }}>
        <PageHeader title="Chat" subtitle={family?.name ?? 'Family communication'} large />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: insets.bottom + 120 }}
      >
        <LinearGradient
          colors={isDark ? ['#1A1528', '#2D2640'] : ['#EEF2FF', '#FDF4FF']}
          style={{ borderRadius: radii['2xl'], padding: 18, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}
        >
          <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 20 * layout.fontScale }}>Family chat</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 22 }}>
            {analytics.total} messages · {analytics.media} media · {members?.length ?? 0} members
          </Text>
          {typingName ? (
            <Text style={{ color: colors.primary, marginTop: 8, fontFamily: 'Inter_600SemiBold' }}>{typingName} is typing…</Text>
          ) : null}
        </LinearGradient>

        {pinnedMessage ? (
          <View style={{ marginBottom: 12 }}>
            <PinnedBanner message={pinnedMessage} editedTexts={prefs.editedTexts} onPress={() => navigate('Conversation')} onUnpin={() => {}} />
          </View>
        ) : null}

        <SectionTitle title="Quick access" subtitle="Premium family messaging" />
        <View style={styles.grid}>
          {SHORTCUTS.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => navigate(item.screen)}
              style={({ pressed }) => [{ width: '47%', opacity: pressed ? 0.9 : 1 }]}
            >
              <LinearGradient
                colors={item.primary ? (isDark ? ['#312E81', '#4338CA'] : ['#6366F1', '#818CF8']) : [colors.surface, colors.surface]}
                style={[styles.tile, { borderRadius: radii.xl, borderColor: colors.border, borderWidth: item.primary ? 0 : StyleSheet.hairlineWidth }]}
              >
                <Ionicons name={item.icon} size={22} color={item.primary ? '#fff' : colors.primary} />
                <Text style={{ color: item.primary ? '#fff' : colors.text, fontFamily: 'Inter_600SemiBold', marginTop: 10, fontSize: 14 * layout.fontScale }}>
                  {item.label}
                </Text>
              </LinearGradient>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <FAB
        icon={<Ionicons name="chatbubbles" size={26} color="#FFFFFF" />}
        onPress={() => navigate('Conversation')}
        accessibilityLabel="Open conversation"
        style={{ bottom: insets.bottom + 100 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { padding: 16, minHeight: 88 },
});
