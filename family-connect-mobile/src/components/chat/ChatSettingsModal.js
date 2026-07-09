import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chatTypography } from '../../constants/chatTheme';
import { useTheme } from '../../hooks/useTheme';
import { useUIMode } from '../../contexts/UIModeContext';

function SettingRow({ icon, label, value, onPress, right, colors }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && onPress && { opacity: 0.7 }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: 'rgba(99,102,241,0.1)' }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: colors.text, fontFamily: chatTypography.fontFamilyRegular }]}>
        {label}
      </Text>
      {right ?? (value ? <Text style={{ color: colors.textSecondary }}>{value}</Text> : null)}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} /> : null}
    </Pressable>
  );
}

export function ChatSettingsModal({
  visible,
  onClose,
  muted,
  archived,
  starredCount,
  onToggleMute,
  onToggleArchive,
  onWallpaper,
  onMediaGallery,
  onThemeToggle,
  members,
}) {
  const { colors, isDark } = useTheme();
  const { themePreference, setThemePreference } = useUIMode();
  const insets = useSafeAreaInsets();

  const pickWallpaper = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onWallpaper?.(result.assets[0].uri);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text, fontFamily: chatTypography.fontFamilyBold }]}>
            Group settings
          </Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <Text style={[styles.section, { color: colors.textSecondary }]}>Members · {members?.length ?? 0}</Text>
          {members?.map((m) => {
            const user = m.user ?? m;
            return (
              <View key={user._id} style={[styles.memberRow, { borderColor: colors.border }]}>
                <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
                <Text style={{ color: colors.text, flex: 1, fontFamily: chatTypography.fontFamilyRegular }}>
                  {user.fullName}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Online</Text>
              </View>
            );
          })}

          <Text style={[styles.section, { color: colors.textSecondary, marginTop: 20 }]}>Preferences</Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingRow
              icon="notifications-off-outline"
              label="Mute notifications"
              colors={colors}
              right={<Switch value={muted} onValueChange={onToggleMute} trackColor={{ true: colors.primary }} />}
            />
            <SettingRow
              icon="archive-outline"
              label="Archive chat"
              colors={colors}
              right={<Switch value={archived} onValueChange={onToggleArchive} trackColor={{ true: colors.primary }} />}
            />
            <SettingRow
              icon="moon-outline"
              label="Dark mode"
              colors={colors}
              right={
                <Switch
                  value={themePreference === 'dark' || (themePreference === 'system' && isDark)}
                  onValueChange={() => {
                    const next = isDark ? 'light' : 'dark';
                    setThemePreference(next);
                    onThemeToggle?.(next);
                  }}
                  trackColor={{ true: colors.primary }}
                />
              }
            />
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
            <SettingRow icon="image-outline" label="Wallpaper" colors={colors} onPress={pickWallpaper} />
            <SettingRow
              icon="images-outline"
              label="Shared media"
              colors={colors}
              value={`${starredCount ?? 0} starred`}
              onPress={onMediaGallery}
            />
            <SettingRow icon="star-outline" label="Starred messages" colors={colors} value={String(starredCount ?? 0)} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 22 },
  section: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 16 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
});
