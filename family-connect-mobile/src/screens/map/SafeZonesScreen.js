import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PageHeader, Screen, Button, SectionTitle, Card } from '../../design-system';
import { SafeZoneCard } from '../../components/map';
import { useMapModule } from '../../contexts/MapModuleContext';
import { ZONE_PRESETS } from '../../utils/mapModuleHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { useResponsive } from '../../design-system';

export default function SafeZonesScreen() {
  const navigation = useNavigation();
  const { horizontalPadding } = useResponsive();
  const { colors, layout } = useTheme();
  const { user } = useAuth();
  const { safeZones, addSafeZone, removeSafeZone, myLocation, zoneAlerts } = useMapModule();
  const [saving, setSaving] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'parent';

  const addZone = useCallback(
    async (preset) => {
      if (!myLocation) {
        Alert.alert('Location needed', 'Share your location first to place a zone at your position.');
        return;
      }
      setSaving(true);
      try {
        await addSafeZone(preset, { latitude: myLocation.latitude, longitude: myLocation.longitude });
      } catch (e) {
        Alert.alert('Could not add zone', e.message || 'Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [myLocation, addSafeZone],
  );

  const deleteZone = useCallback(
    async (zone) => {
      try {
        await removeSafeZone(zone);
      } catch (e) {
        Alert.alert('Could not delete zone', e.message || 'Please try again.');
      }
    },
    [removeSafeZone],
  );

  return (
    <Screen edges={['top']}>
      <PageHeader title="Safe zones" subtitle="Home, school, office & more" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginBottom: 16, lineHeight: 22 }}>
          Zones are saved for the whole family. Everyone gets an alert when a child or elder enters or leaves a zone.
        </Text>

        {canManage ? (
          <>
            <SectionTitle title="Add zone at my location" />
            {ZONE_PRESETS.map((p) => (
              <Button key={p.id} title={`Add ${p.label}`} onPress={() => addZone(p)} loading={saving} variant="secondary" style={{ marginBottom: 8 }} />
            ))}
          </>
        ) : (
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale }}>
              Only parents and admins can add or remove safe zones.
            </Text>
          </Card>
        )}

        <SectionTitle title="Family zones" subtitle={`${safeZones.length} configured`} />
        {safeZones.length === 0 ? (
          <Card>
            <Text style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale }}>
              No safe zones yet. Add one at your current position.
            </Text>
          </Card>
        ) : null}
        {safeZones.map((z) => (
          <SafeZoneCard
            key={z.id}
            zone={z}
            onPress={() => navigation.navigate('PlaceDetails', { zone: z })}
            onDelete={canManage ? deleteZone : undefined}
          />
        ))}

        {zoneAlerts.length > 0 ? (
          <>
            <SectionTitle title="Recent alerts" subtitle="Live enter/exit activity" />
            {zoneAlerts.map((a) => (
              <Card key={a.id} style={{ marginBottom: 8 }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 * layout.fontScale }}>
                  {a.fullName} {a.action === 'enter' ? 'arrived at' : 'left'} {a.zoneName}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 * layout.fontScale, marginTop: 2 }}>
                  {new Date(a.createdAt).toLocaleTimeString()}
                </Text>
              </Card>
            ))}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
