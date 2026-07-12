import React, { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Loader, PageHeader, Screen } from '../../design-system';
import { RSVPCard } from '../../components/events';
import { getEventDetails } from '../../services/eventService';
import { useResponsive } from '../../design-system';

export default function RSVPManagementScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { horizontalPadding } = useResponsive();
  const { id } = route.params ?? {};
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setLoading(true);
      getEventDetails(id)
        .then(setEvent)
        .finally(() => setLoading(false));
    }, [id]),
  );

  if (loading) return <Loader fullScreen />;

  return (
    <Screen edges={['top']}>
      <PageHeader title="RSVP management" subtitle={event?.title} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <RSVPCard event={event} showGuests />
      </ScrollView>
    </Screen>
  );
}
