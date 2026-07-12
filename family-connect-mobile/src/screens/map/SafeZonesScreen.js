import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { PageHeader, Screen, Button, SectionTitle } from '../../design-system';
import { SafeZoneCard } from '../../components/map';
import { useMapModule } from '../../contexts/MapModuleContext';
import { ZONE_PRESETS } from '../../utils/mapModuleHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function SafeZonesScreen() {
  const navigation = useNavigation();
  const { horizontalPadding } = useResponsive();
  const { colors, layout } = useTheme();
  const { safeZones, saveSafeZones, myLocation } = useMapModule();
  const [saving, setSaving] = useState(false);

  const addZone = useCallback(
    async (preset) => {
      if (!myLocation) {
        Alert.alert('Location needed', 'Share your location first to place a zone at your position.');
        return;
      }
      setSaving(true);
      const zone = {
        id: `${preset.id}-${Date.now()}`,
        label: preset.label,
        icon: preset.icon,
        color: preset.color,
        latitude: myLocation.latitude,
        longitude: myLocation.longitude,
        radiusM: 200,
        notifyEnter: true,
        notifyExit: true,
      };
      await saveSafeZones([...safeZones, zone]);
      setSaving(false);
    },
    [myLocation, safeZones, saveSafeZones],
  );

  const deleteZone = useCallback(
    async (zone) => {
      await saveSafeZones(safeZones.filter((z) => z.id !== zone.id));
    },
    [safeZones, saveSafeZones],
  );

  return (
    <Screen edges={['top']}>
      <PageHeader title="Safe zones" subtitle="Home, school, office & more" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginBottom: 16, lineHeight: 22 }}>
          Add zones at your current location. Family members receive enter/exit alerts when location sharing is on.
        </Text>

        <SectionTitle title="Add zone" />
        {ZONE_PRESETS.map((p) => (
          <Button key={p.id} title={`Add ${p.label}`} onPress={() => addZone(p)} loading={saving} variant="secondary" style={{ marginBottom: 8 }} />
        ))}

        <SectionTitle title="Your zones" subtitle={`${safeZones.length} configured`} />
        {safeZones.map((z) => (
          <SafeZoneCard key={z.id} zone={z} onPress={() => navigation.navigate('PlaceDetails', { zone: z })} onDelete={deleteZone} />
        ))}
      </ScrollView>
    </Screen>
  );
}
