import React, { useEffect } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader, Screen } from '../../design-system';
import { TripCard, TravelStatsCard } from '../../components/map';
import { useMapModule } from '../../contexts/MapModuleContext';
import { useResponsive } from '../../design-system';

export default function DrivingHistoryScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();
  const { trips, analytics, rebuildTrips } = useMapModule();

  useEffect(() => {
    rebuildTrips();
  }, [rebuildTrips]);

  const drivingTrips = trips.filter((t) => (t.avgSpeedKmh ?? 0) >= 15);

  return (
    <Screen edges={['top']}>
      <PageHeader title="Driving history" subtitle="Trips & average speed" onBack={() => navigation.goBack()} />

      <FlatList
        data={drivingTrips}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<TravelStatsCard analytics={analytics} />}
        renderItem={({ item }) => <TripCard trip={item} onPress={() => navigation.navigate('TripHistory', { tripId: item.id })} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        initialNumToRender={10}
      />
    </Screen>
  );
}
