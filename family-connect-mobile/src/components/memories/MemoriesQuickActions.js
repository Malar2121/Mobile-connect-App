import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SectionTitle } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';

const ACTIONS = [
  { id: 'upload', labelKey: 'memories.quickUpload', icon: 'cloud-upload-outline', screen: 'UploadMemory' },
  { id: 'stories', labelKey: 'memories.quickStories', icon: 'book-outline', screen: 'FamilyStories' },
  { id: 'albums', labelKey: 'memories.albums', icon: 'albums-outline', screen: 'Albums' },
  { id: 'timeline', labelKey: 'memories.timeline', icon: 'time-outline', screen: 'StoryTimeline' },
  { id: 'legacy', labelKey: 'memories.quickLegacy', icon: 'heart-outline', screen: 'LegacyMode' },
  { id: 'search', labelKey: 'memories.quickSearch', icon: 'search-outline', screen: 'SearchMemories' },
  { id: 'map', labelKey: 'memories.quickMap', icon: 'map-outline', screen: 'MemoryMap' },
];

function MemoriesQuickActionsComponent({ onNavigate, isMinor }) {
  const { colors, layout, radii } = useTheme();

  const { t } = useI18n();
  const visible = isMinor ? ACTIONS.filter((a) => a.id !== 'upload') : ACTIONS;

  return (
    <View style={{ marginBottom: layout.sectionGap }}>
      <SectionTitle title={t('common.quickActions')} />
      <View style={styles.grid}>
        {visible.map((a) => (
          <Pressable
            key={a.id}
            onPress={() => onNavigate?.(a.screen)}
            style={({ pressed }) => [
              styles.tile,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl, minHeight: layout.minTouch + 12, opacity: pressed ? 0.9 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t(a.labelKey)}
          >
            <Ionicons name={a.icon} size={22} color={colors.primary} />
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 12, marginTop: 8 }}>{t(a.labelKey)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export const MemoriesQuickActions = memo(MemoriesQuickActionsComponent);

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '31%', padding: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
});
