import React, { useCallback } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PageHeader, Screen } from '../../design-system';
import { TimelineCard } from '../../components/memories';
import { useMemoriesModuleData } from '../../hooks/useMemoriesModuleData';
import { useResponsive } from '../../design-system';

export default function StoryTimelineScreen() {
  const navigation = useNavigation();
  const { horizontalPadding } = useResponsive();
  const { timeline, refreshing, refresh } = useMemoriesModuleData();

  const renderItem = useCallback(
    ({ item }) => (
      <TimelineCard
        group={item}
        onMemoryPress={(m) => navigation.navigate('MemoryDetails', { id: String(m._id) })}
      />
    ),
    [navigation],
  );

  return (
    <Screen edges={['top']}>
      <PageHeader title="Timeline" subtitle="Your family story" onBack={() => navigation.goBack()} />
      <FlatList
        data={timeline}
        keyExtractor={(item) => item.label}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
      />
    </Screen>
  );
}
