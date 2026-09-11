import React, { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader, Screen } from '../../design-system';
import { useFamilyTreeModuleData } from '../../hooks/useFamilyTreeModuleData';
import { HeritageCard } from '../../components/family-tree';
import { useResponsive } from '../../design-system';
import { useI18n } from '../../i18n';

export default function HeritageTimelineScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();

  const { t } = useI18n();
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
      <PageHeader title={t('tree.heritageTimeline')} subtitle={t('tree.chronological')} onBack={() => navigation.goBack()} />

      <FlatList
        data={heritageTimeline}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <HeritageCard item={item} onPress={onPressItem} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
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
                  title: t('tree.yourTimelineWillGrow'),
                  body: t('tree.addEventsMemoriesAndLegacyProfiles'),
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
