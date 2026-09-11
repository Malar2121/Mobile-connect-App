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
import { useI18n, translate } from '../../i18n';

const SHORTCUTS = [
  { id: 'conversation', label: t('chat.openChat'), icon: 'chatbubbles', screen: 'Conversation', primary: true },
  { id: 'search', get label() { return translate('common.search'); }, icon: 'search', screen: 'ChatSearch' },
  { id: 'media', get label() { return translate('chat.media'); }, icon: 'images', screen: 'ChatMediaGallery' },
  { id: 'files', get label() { return translate('chat.files'); }, icon: 'folder', screen: 'SharedFiles' },
  { id: 'pinned', get label() { return translate('chat.pinned'); }, icon: 'pin', screen: 'PinnedMessages' },
  { id: 'starred', get label() { return translate('chat.starred'); }, icon: 'star', screen: 'StarredMessages' },
  { id: 'voice', get label() { return translate('chat.voice'); }, icon: 'mic', screen: 'VoiceMessage' },
  { id: 'settings', get label() { return translate('profile.settings'); }, icon: 'settings', screen: 'ChatSettings' },
];

export default function ChatHomeScreen() {
  const navigation = useNavigation();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();
  const { colors, layout, radii, isDark, uiMode } = useTheme();
  const { family, members, messages, loading, pinnedMessage, prefs, typingName, loadHistory } = useChatModule();

  const analytics = useMemo(() => getChatAnalytics(messages, members), [messages, members]);
  const navigate = useCallback((screen) => navigation.navigate(screen), [navigation]);

  if (loading && !messages.length) {
    return (
      <Screen edges={['top']}>
        <PageHeader title={t('chat.title')} subtitle={t('chat.subtitle')} large />
        <ChatSkeleton />
      </Screen>
    );
  }

  if (uiMode === 'minor') {
    return (
      <Screen edges={['top']}>
        <View style={{ alignItems: 'center', marginTop: 40, paddingHorizontal: horizontalPadding }}>
          <Text style={{ fontSize: 48 }}>👨‍👩‍👧‍👦</Text>
          <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 28, marginTop: 24, textAlign: 'center' }}>
            {t('chat.familyChat2')}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 18, marginTop: 12, textAlign: 'center' }}>
            {t('chat.talkToMomDadAndThe')}
          </Text>
          
          <Pressable
            onPress={() => navigate('Conversation')}
            style={({ pressed }) => [
              {
                backgroundColor: '#3b82f6',
                paddingVertical: 24,
                paddingHorizontal: 48,
                borderRadius: radii['3xl'],
                marginTop: 64,
                opacity: pressed ? 0.9 : 1,
                alignItems: 'center',
                width: '100%'
              }
            ]}
          >
            <Ionicons name="chatbubbles" size={40} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 12 }}>
              {t('dashboard.qaOpenChat')}
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} noPadding>
      <View style={{ paddingHorizontal: horizontalPadding }}>
        <PageHeader title={t('chat.title')} subtitle={family?.name ?? t('chat.subtitle')} large />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: insets.bottom + 120 }}
      >
        <LinearGradient
          colors={isDark ? ['#1A1528', '#2D2640'] : ['#EEF2FF', '#FDF4FF']}
          style={{ borderRadius: radii['2xl'], padding: 18, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}
        >
          <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 20 * layout.fontScale }}>{t('chat.familyChat')}</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 22 }}>
            {t('chat.homeStats', { messages: analytics.total, media: analytics.media, members: members?.length ?? 0 })}
          </Text>
          {typingName ? (
            <Text style={{ color: colors.primary, marginTop: 8, fontFamily: 'Inter_600SemiBold' }}>{t('chat.nameIsTyping', { name: typingName })}</Text>
          ) : null}
        </LinearGradient>

        <SectionTitle title={t('chat.quickAccess')} subtitle={t('chat.quickAccessSubtitle')} />
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
        accessibilityLabel={t('chat.openConversation')}
        style={{ bottom: insets.bottom + 100 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { padding: 16, minHeight: 88 },
});
