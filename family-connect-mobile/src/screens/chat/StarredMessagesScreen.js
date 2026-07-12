import React, { useCallback, useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader, Screen } from '../../design-system';
import { useChatModule } from '../../contexts/ChatModuleContext';
import { SearchResultCard } from '../../components/chat/SearchResultCard';
import { getStarredMessages } from '../../services/chatService';
import { isMessageStarred } from '../../utils/chatModuleHelpers';
import { useResponsive } from '../../design-system';

export default function StarredMessagesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();
  const { messages, userId, prefs } = useChatModule();
  const [starred, setStarred] = useState([]);

  useEffect(() => {
    getStarredMessages()
      .then(setStarred)
      .catch(() => setStarred(messages.filter((m) => isMessageStarred(m, userId, prefs.starredIds))));
  }, [messages, userId, prefs.starredIds]);

  const onSelect = useCallback(() => navigation.navigate('Conversation'), [navigation]);

  return (
    <Screen edges={['top']}>
      <PageHeader title="Starred messages" subtitle="Your saved messages" onBack={() => navigation.goBack()} />
      <FlatList
        data={starred}
        keyExtractor={(item) => String(item._id)}
        renderItem={({ item }) => <SearchResultCard message={item} onPress={onSelect} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        initialNumToRender={10}
      />
    </Screen>
  );
}
