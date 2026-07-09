import React, { useMemo } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { ChatModuleProvider } from '../contexts/ChatModuleContext';
import { useChat } from '../hooks/useChat';
import { useChatPreferences } from '../hooks/useChatPreferences';
import ChatHomeScreen from '../screens/chat/ChatHomeScreen';
import ConversationScreen from '../screens/chat/ConversationScreen';
import ChatMediaGalleryScreen from '../screens/chat/ChatMediaGalleryScreen';
import ChatSearchScreen from '../screens/chat/ChatSearchScreen';
import ChatSettingsScreen from '../screens/chat/ChatSettingsScreen';
import PinnedMessagesScreen from '../screens/chat/PinnedMessagesScreen';
import StarredMessagesScreen from '../screens/chat/StarredMessagesScreen';
import SharedFilesScreen from '../screens/chat/SharedFilesScreen';
import VoiceMessageScreen from '../screens/chat/VoiceMessageScreen';

const Stack = createNativeStackNavigator();

function ChatModuleRoot() {
  const { user, token } = useAuth();
  const { family, members } = useFamily();
  const chatPrefs = useChatPreferences(family?._id);
  const {
    prefs,
    pinMessage,
    unpinMessage,
    toggleStar,
    addReaction,
    setEditedText,
    scheduleMessage,
    removeScheduled,
    setWallpaper,
    setMuted,
    setArchived,
    setLastReadAt,
  } = chatPrefs;

  const chatActions = useMemo(
    () => ({ setLastReadAt, scheduleMessage, removeScheduled, setEditedText, pinMessage, unpinMessage, toggleStar, addReaction }),
    [setLastReadAt, scheduleMessage, removeScheduled, setEditedText, pinMessage, unpinMessage, toggleStar, addReaction],
  );

  const chat = useChat({ user, token, family, members, prefs, chatActions });

  const value = useMemo(
    () => ({
      ...chat,
      ...chatPrefs,
      user,
      token,
      family,
      members,
    }),
    [chat, chatPrefs, user, token, family, members],
  );

  return (
    <ChatModuleProvider value={value}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ChatHome" component={ChatHomeScreen} />
        <Stack.Screen name="Conversation" component={ConversationScreen} />
        <Stack.Screen name="ChatMediaGallery" component={ChatMediaGalleryScreen} />
        <Stack.Screen name="ChatSearch" component={ChatSearchScreen} />
        <Stack.Screen name="ChatSettings" component={ChatSettingsScreen} />
        <Stack.Screen name="PinnedMessages" component={PinnedMessagesScreen} />
        <Stack.Screen name="StarredMessages" component={StarredMessagesScreen} />
        <Stack.Screen name="SharedFiles" component={SharedFilesScreen} />
        <Stack.Screen name="VoiceMessage" component={VoiceMessageScreen} />
      </Stack.Navigator>
    </ChatModuleProvider>
  );
}

export default function ChatNavigator() {
  return <ChatModuleRoot />;
}
