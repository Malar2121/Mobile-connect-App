import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PageHeader, Screen } from '../../design-system';
import { TripCard, LocationTimeline, MiniMapCard } from '../../components/map';
import { useMapModule } from '../../contexts/MapModuleContext';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';
import { useI18n } from '../../i18n';

export default function TripHistoryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const focusId = route.params?.tripId;
  const { horizontalPadding } = useResponsive();

  const { t } = useI18n();
  const { colors, layout } = useTheme();
  const { trips } = useMapModule();

  const focusTrip = useMemo(() => trips.find((t) => t.id === focusId), [trips, focusId]);

  const timeline = (focusTrip?.waypoints ?? []).map((w, i) => ({
    id: `wp-${i}`,
    title: `Waypoint ${i + 1}`,
    subtitle: `${w.latitude?.toFixed(4)}, ${w.longitude?.toFixed(4)}`,
    time: w.at ? new Date(w.at).toLocaleTimeString() : '',
  }));

  return (
    <Screen edges={['top']}>
      <PageHeader title={t('map.tripHistory')} subtitle={t('map.timelineRoutes')} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {focusTrip ? (
          <>
            <TripCard trip={focusTrip} />
            <MiniMapCard locations={focusTrip.waypoints} height={180} />
            <LocationTimeline items={timeline} title={t('map.routeTimeline')} />
          </>
        ) : (
          trips.map((t) => <TripCard key={t.id} trip={t} onPress={() => navigation.navigate('TripHistory', { tripId: t.id })} />)
        )}

        {!trips.length ? (
          <Text style={{ color: colors.textTertiary, textAlign: 'center', marginTop: 24, fontSize: 14 * layout.fontScale }}>
            Trips are built from your location points while sharing. Enable location sharing on the live map.
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
