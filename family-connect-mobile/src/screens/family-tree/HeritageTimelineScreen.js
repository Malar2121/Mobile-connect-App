import React, { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader, Screen } from '../../design-system';
import { useFamilyTreeModuleData } from '../../hooks/useFamilyTreeModuleData';
import { HeritageCard } from '../../components/family-tree';
import { useResponsive } from '../../design-system';

export default function HeritageTimelineScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();
  const { heritageTimeline, loading, refreshing, refresh } = useFamilyTreeModuleData();

  const onPressItem = useCallback(
    (item) => {
      if (item.memberId) {
        navigation.navigate('PersonProfile', { memberId: String(item.memberId) });
      }
    },
    [navigation],
  );

  return (
    <Screen edges={['top']}>
      <PageHeader title="Heritage timeline" subtitle="Chronological family history" onBack={() => navigation.goBack()} />

      <FlatList
        data={heritageTimeline}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <HeritageCard item={item} onPress={onPressItem} />}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: insets.bottom + 24 }}
        refreshing={refreshing}
        onRefresh={refresh}
        initialNumToRender={12}
        ListEmptyComponent={
          !loading ? (
            <View style={{ paddingTop: 24 }}>
              <HeritageCard
                item={{
                  id: 'empty',
                  type: 'memory',
                  title: 'Your timeline will grow',
                  body: 'Add events, memories, and legacy profiles to build family history.',
                  icon: 'time-outline',
                }}
              />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}
