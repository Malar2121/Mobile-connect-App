import React from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { PageHeader, Screen, SectionTitle } from '../../design-system';
import { useChatModule } from '../../contexts/ChatModuleContext';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile } from '../../services/authService';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function ChatSettingsScreen() {
  const navigation = useNavigation();
  const { horizontalPadding } = useResponsive();
  const { colors, layout } = useTheme();
  const { prefs, setMuted, setArchived, setWallpaper, messages } = useChatModule();
  const { user, setUser } = useAuth();

  const starredCount = messages.filter((m) => (m.starredBy ?? []).length).length;

  return (
    <Screen edges={['top']}>
      <PageHeader title="Chat settings" subtitle="Notifications & appearance" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionTitle title="Notifications" />
        <SettingRow label="Mute chat" value={prefs.muted} onChange={setMuted} colors={colors} layout={layout} />
        <SettingRow 
          label="Push notifications" 
          value={user?.pushPreferences?.chat ?? true} 
          onChange={async (val) => {
            try {
              const updated = await updateProfile({ pushPreferences: { ...user.pushPreferences, chat: val } });
              setUser(updated);
            } catch (err) {
              console.log('Failed to update push preferences', err);
            }
          }} 
          colors={colors} 
          layout={layout} 
        />

        <SectionTitle title="Chat" />
        <SettingRow label="Archive chat" value={prefs.archived} onChange={setArchived} colors={colors} layout={layout} />

        <NavRow label="Wallpaper" onPress={async () => {
          const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
          if (!r.canceled && r.assets[0]) setWallpaper(r.assets[0].uri);
        }} colors={colors} />

        <NavRow label="Pinned messages" onPress={() => navigation.navigate('PinnedMessages')} colors={colors} />
        <NavRow label={`Starred messages (${starredCount || prefs.starredIds.length})`} onPress={() => navigation.navigate('StarredMessages')} colors={colors} />
        <NavRow label="Shared files" onPress={() => navigation.navigate('SharedFiles')} colors={colors} />
        <NavRow label="Media gallery" onPress={() => navigation.navigate('ChatMediaGallery')} colors={colors} />

        <SectionTitle title="Family safety" subtitle="Minor mode protections" />
        <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, lineHeight: 22 }}>
          Sensitive media previews are hidden in minor mode. Parental visibility architecture prepared for admin message review API.
        </Text>
      </ScrollView>
    </Screen>
  );
}

function SettingRow({ label, value, onChange, colors, layout }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 15 * layout.fontScale }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label} />
    </View>
  );
}

function NavRow({ label, onPress, colors }) {
  return (
    <Text onPress={onPress} style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      {label} →
    </Text>
  );
}
