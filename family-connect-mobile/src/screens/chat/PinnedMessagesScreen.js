import React, { useCallback, useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader, Screen } from '../../design-system';
import { useChatModule } from '../../contexts/ChatModuleContext';
import { SearchResultCard } from '../../components/chat/SearchResultCard';
import { getPinnedMessages } from '../../services/chatService';
import { useResponsive } from '../../design-system';

export default function PinnedMessagesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();
  const { messages } = useChatModule();
  const [pinned, setPinned] = useState([]);

  useEffect(() => {
    getPinnedMessages()
      .then(setPinned)
      .catch(() => setPinned(messages.filter((m) => m.pinnedAt)));
  }, [messages]);

  const onSelect = useCallback(() => navigation.navigate('Conversation'), [navigation]);

  return (
    <Screen edges={['top']}>
      <PageHeader title="Pinned messages" subtitle="Server synchronized" onBack={() => navigation.goBack()} />
      <FlatList
        data={pinned}
        keyExtractor={(item) => String(item._id)}
        renderItem={({ item }) => <SearchResultCard message={item} onPress={onSelect} />}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: insets.bottom + 24 }}
        initialNumToRender={10}
      />
    </Screen>
  );
}
