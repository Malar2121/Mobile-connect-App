import React, { useMemo } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader, Screen, SectionTitle } from '../../design-system';
import { useChatModule } from '../../contexts/ChatModuleContext';
import { groupSharedFiles } from '../../utils/chatModuleHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function SharedFilesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();
  const { colors, layout } = useTheme();
  const { messages } = useChatModule();
  const groups = useMemo(() => groupSharedFiles(messages), [messages]);

  return (
    <Screen edges={['top']}>
      <PageHeader title="Shared files" subtitle="Grouped by type" onBack={() => navigation.goBack()} />

      <FlatList
        data={[
          { key: 'images', title: 'Images', items: groups.images, icon: 'image' },
          { key: 'videos', title: 'Videos', items: groups.videos, icon: 'videocam' },
          { key: 'documents', title: 'Documents', items: groups.documents, icon: 'document-text' },
          { key: 'audio', title: 'Audio', items: groups.audio, icon: 'mic' },
        ]}
        keyExtractor={(s) => s.key}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: insets.bottom + 24 }}
        renderItem={({ item: section }) => (
          <View style={{ marginBottom: layout.sectionGap }}>
            <SectionTitle title={section.title} subtitle={`${section.items.length} files`} />
            {section.items.length ? (
              section.items.slice(0, 12).map((m) => (
                <Pressable
                  key={m._id}
                  onPress={() => navigation.navigate('Conversation')}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 }}
                >
                  {m.mediaType === 'image' ? (
                    <Image source={{ uri: m.mediaUrl }} style={{ width: 48, height: 48, borderRadius: 8 }} />
                  ) : (
                    <View style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: colors.primarySubtle, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={section.icon} size={22} color={colors.primary} />
                    </View>
                  )}
                  <Text style={{ color: colors.text, flex: 1 }} numberOfLines={1}>
                    {m.documentName || m.text || section.title}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text style={{ color: colors.textTertiary, fontSize: 13 }}>No {section.title.toLowerCase()} yet</Text>
            )}
          </View>
        )}
      />
    </Screen>
  );
}
