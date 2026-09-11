import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';

function StoryRingsComponent({ memories, onOpenStory }) {
  const { colors, layout, radii, isDark } = useTheme();

  const { t } = useI18n();
  const stories = (memories ?? []).slice(0, 10);

  if (!stories.length) return null;

  return (
    <View style={{ marginBottom: layout.sectionGap }}>
      <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 16 * layout.fontScale, marginBottom: 12 }}>{t('memories.quickStories')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
        {stories.map((m, index) => (
          <Pressable key={String(m._id)} onPress={() => onOpenStory?.(index)} accessibilityLabel={t('memories.viewStory')}>
            <LinearGradient colors={['#7C3AED', '#4F56D9', '#0EA5E9']} style={styles.ring}>
              <View style={[styles.inner, { backgroundColor: isDark ? colors.background : '#fff', borderRadius: 36 }]}>
                <Image source={{ uri: m.mediaUrl }} style={styles.avatar} />
              </View>
            </LinearGradient>
            <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 6, maxWidth: 72, textAlign: 'center' }} numberOfLines={1}>
              {m.caption || t('memories.memory')}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export const StoryRings = memo(StoryRingsComponent);

const styles = StyleSheet.create({
  ring: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  inner: { width: 68, height: 68, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30 },
});
