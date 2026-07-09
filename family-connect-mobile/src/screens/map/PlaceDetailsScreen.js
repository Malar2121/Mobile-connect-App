import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PageHeader, Screen } from '../../design-system';
import { SafeZoneCard } from '../../components/map';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function PlaceDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const zone = route.params?.zone;
  const { colors, layout } = useTheme();
  const { horizontalPadding } = useResponsive();

  return (
    <Screen edges={['top']}>
      <PageHeader title={zone?.label ?? 'Place'} subtitle="Safe zone details" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 40 }}>
        {zone ? <SafeZoneCard zone={zone} /> : null}
        <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, lineHeight: 22, marginTop: 16 }}>
          Coordinates: {zone?.latitude?.toFixed(5)}, {zone?.longitude?.toFixed(5)}
        </Text>
        <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 12 }}>
          Enter/exit notifications fire locally when sharing location. TODO: server geofence webhooks.
        </Text>
      </ScrollView>
    </Screen>
  );
}
