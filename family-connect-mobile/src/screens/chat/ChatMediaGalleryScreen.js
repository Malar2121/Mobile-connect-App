import React, { useMemo } from 'react';
import { FlatList, Image, Pressable, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader, Screen } from '../../design-system';
import { useChatModule } from '../../contexts/ChatModuleContext';
import { getMediaMessages } from '../../utils/chatHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function ChatMediaGalleryScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();
  const { colors } = useTheme();
  const { messages } = useChatModule();
  const media = useMemo(() => getMediaMessages(messages), [messages]);

  return (
    <Screen edges={['top']}>
      <PageHeader title="Media gallery" subtitle={`${media.length} items`} onBack={() => navigation.goBack()} />
      <FlatList
        data={media}
        numColumns={3}
        keyExtractor={(item) => String(item._id)}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        initialNumToRender={15}
        renderItem={({ item }) => (
          <Pressable style={{ flex: 1 / 3, aspectRatio: 1, padding: 2 }}>
            <Image source={{ uri: item.mediaUrl }} style={{ flex: 1, borderRadius: 8, backgroundColor: '#ccc' }} />
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={{ color: colors.textTertiary, textAlign: 'center', marginTop: 40 }}>No media shared yet</Text>
        }
      />
    </Screen>
  );
}
