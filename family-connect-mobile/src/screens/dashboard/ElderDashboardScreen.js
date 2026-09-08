import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useVoicePrompts } from '../../hooks/useVoicePrompts';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useI18n } from '../../i18n';
import { Avatar, Card } from '../../design-system';

/**
 * Elder-mode home screen: a handful of very large, high-contrast actions
 * instead of the dense standard dashboard. Font sizes here are intentionally
 * bigger than the elder fontScale alone would give.
 */
export default function ElderDashboardScreen() {
  const { colors, layout, radii, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { t } = useI18n();
  const { members, liveCount, upcomingEvents } = useDashboardData();

  const firstName = user?.fullName?.split(' ')[0] ?? '';
  const nextEvent = upcomingEvents?.[0];

  // Spoken orientation on arrival, in the app's current language. Silent
  // unless the user is in elder mode with prompts left on.
  const voice = useVoicePrompts();
  useFocusEffect(
    useCallback(() => {
      voice.announceScreen(
        `${t('elder.hello')}${firstName ? `, ${firstName}` : ''}. ${
          nextEvent
            ? t('elder.voiceNextEvent', { title: nextEvent.title })
            : t('elder.voiceNoEvents')
        }`,
      );
      return () => voice.stop();
    }, [voice, t, firstName, nextEvent]),
  );

  const ACTIONS = [
    {
      id: 'map',
      label: t('elder.familyMap'),
      icon: 'map',
      color: colors.primary,
      onPress: () => {
        voice.speakKey('elder.familyMap');
        navigation.navigate('Map');
      },
    },
    {
      id: 'chat',
      label: t('elder.messages'),
      icon: 'chatbubbles',
      color: '#2563eb',
      onPress: () => {
        voice.speakKey('elder.messages');
        navigation.navigate('Chat');
      },
    },
    // Events, Celebrations, Memories and the Family Tree live in the Profile
    // stack so the tab bar can stay at four large targets. Without these tiles
    // an elder had no route to them at all.
    {
      id: 'events',
      label: t('elder.events'),
      icon: 'calendar',
      color: colors.secondary,
      onPress: () => {
        voice.speakKey('elder.events');
        navigation.navigate('Profile', { screen: 'EventsModule', params: { screen: 'EventsHome' } });
      },
    },
    {
      id: 'celebrations',
      label: t('elder.celebrations'),
      icon: 'gift',
      color: colors.warning,
      onPress: () => {
        voice.speakKey('elder.celebrations');
        navigation.navigate('Profile', { screen: 'EventsModule', params: { screen: 'Celebrations' } });
      },
    },
    {
      id: 'memories',
      label: t('elder.memories'),
      icon: 'images',
      color: colors.accent,
      onPress: () => {
        voice.speakKey('elder.memories');
        navigation.navigate('Profile', { screen: 'MemoriesModule', params: { screen: 'MemoriesHome' } });
      },
    },
    {
      id: 'tree',
      label: t('elder.familyTree'),
      icon: 'git-network',
      color: colors.success,
      onPress: () => {
        voice.speakKey('elder.familyTree');
        navigation.navigate('Profile', { screen: 'FamilyTreeModule', params: { screen: 'FamilyTreeHome' } });
      },
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120, paddingHorizontal: 20 }}
      >
        <Text
          accessibilityRole="header"
          style={{
            color: colors.text,
            fontFamily: 'Inter_700Bold',
            fontSize: 32 * layout.fontScale,
            marginTop: 24,
          }}
        >
          {t('elder.hello')}{firstName ? `, ${firstName}` : ''}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 18 * layout.fontScale, marginTop: 8 }}>
          {t('elder.membersOnline', { count: liveCount ?? 0 })}
        </Text>

        {/* SOS — the most important elder action, always first and huge */}
        <Pressable
          onPress={() => {
            voice.speakKey('elder.voiceOpeningSos');
            navigation.navigate('Map', { screen: 'SOSScreen' });
          }}
          accessibilityRole="button"
          accessibilityLabel={t('elder.sos')}
          style={[
            styles.sos,
            shadows.md,
            { backgroundColor: colors.error ?? '#dc2626', borderRadius: radii['2xl'] ?? 24, marginTop: 28 },
          ]}
        >
          <Ionicons name="alert-circle" size={48} color="#fff" />
          <Text style={styles.sosText}>{t('elder.sos')}</Text>
        </Pressable>

        <View style={styles.grid}>
          {ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              onPress={action.onPress}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              style={[
                styles.action,
                shadows.sm,
                { backgroundColor: action.color, borderRadius: radii['2xl'] ?? 24 },
              ]}
            >
              <Ionicons name={action.icon} size={40} color="#fff" />
              <Text style={styles.actionText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {nextEvent ? (
          <Card style={{ marginTop: 28 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 15 * layout.fontScale }}>
              {t('elder.nextEvent')}
            </Text>
            <Text
              style={{
                color: colors.text,
                fontFamily: 'Inter_700Bold',
                fontSize: 22 * layout.fontScale,
                marginTop: 6,
              }}
            >
              {nextEvent.title}
            </Text>
            {nextEvent.date ? (
              <Text style={{ color: colors.textSecondary, fontSize: 16 * layout.fontScale, marginTop: 6 }}>
                {new Date(nextEvent.date).toLocaleDateString([], {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </Text>
            ) : null}
          </Card>
        ) : null}

        {members?.length ? (
          <Card style={{ marginTop: 20 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 15 * layout.fontScale, marginBottom: 12 }}>
              {t('elder.yourFamily')}
            </Text>
            {members.slice(0, 5).map((member) => (
              <View key={member._id} style={styles.memberRow}>
                <Avatar uri={member.avatar} name={member.fullName} size={44} />
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 18 * layout.fontScale,
                    marginLeft: 14,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {member.fullName}
                </Text>
              </View>
            ))}
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 30,
  },
  sosText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  // Wraps to two tiles per row. Tile styling is unchanged — only the row
  // wrapping is new, so six destinations fit without shrinking any target.
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 20 },
  action: {
    flexGrow: 1,
    flexBasis: '44%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 34,
    gap: 12,
  },
  actionText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
});
