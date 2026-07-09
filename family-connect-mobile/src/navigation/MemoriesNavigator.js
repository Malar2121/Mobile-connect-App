import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MemoriesHomeScreen from '../screens/memories/MemoriesHomeScreen';
import MemoryGalleryScreen from '../screens/memories/MemoryGalleryScreen';
import UploadMemoryScreen from '../screens/memories/UploadMemoryScreen';
import AlbumsScreen from '../screens/memories/AlbumsScreen';
import AlbumDetailsScreen from '../screens/memories/AlbumDetailsScreen';
import MemoryDetailsScreen from '../screens/memories/MemoryDetailsScreen';
import StoryTimelineScreen from '../screens/memories/StoryTimelineScreen';
import LegacyModeScreen from '../screens/memories/LegacyModeScreen';
import SharedAlbumsScreen from '../screens/memories/SharedAlbumsScreen';
import SearchMemoriesScreen from '../screens/memories/SearchMemoriesScreen';
import MemoryMapScreen from '../screens/memories/MemoryMapScreen';
import TaggedMembersScreen from '../screens/memories/TaggedMembersScreen';

const Stack = createNativeStackNavigator();

export default function MemoriesNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MemoriesHome" component={MemoriesHomeScreen} />
      <Stack.Screen name="MemoryGallery" component={MemoryGalleryScreen} />
      <Stack.Screen name="UploadMemory" component={UploadMemoryScreen} />
      <Stack.Screen name="Albums" component={AlbumsScreen} />
      <Stack.Screen name="AlbumDetails" component={AlbumDetailsScreen} />
      <Stack.Screen name="MemoryDetails" component={MemoryDetailsScreen} />
      <Stack.Screen name="StoryTimeline" component={StoryTimelineScreen} />
      <Stack.Screen name="LegacyMode" component={LegacyModeScreen} />
      <Stack.Screen name="SharedAlbums" component={SharedAlbumsScreen} />
      <Stack.Screen name="SearchMemories" component={SearchMemoriesScreen} />
      <Stack.Screen name="MemoryMap" component={MemoryMapScreen} />
      <Stack.Screen name="TaggedMembers" component={TaggedMembersScreen} />
    </Stack.Navigator>
  );
}
