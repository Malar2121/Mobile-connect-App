import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PageHeader, Screen, Button, useToast } from '../../design-system';
import { SafeZoneCard } from '../../components/map';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';

export default function PlaceDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const toast = useToast();
  const zone = route.params?.zone;
  const { colors, layout } = useTheme();
  const { horizontalPadding } = useResponsive();
  const { user } = useAuth();
  const { family } = useFamily();
  const [loading, setLoading] = useState(false);

  const triggerWebhook = async (action) => {
    if (!zone || !user || !family) return;
    setLoading(true);
    try {
      await api.post('/webhooks/geofence', {
        userId: user._id,
        familyId: family._id,
        action,
        locationName: zone.label || 'Safe zone',
      });
      toast.success(`Simulated ${action} webhook`);
    } catch (err) {
      toast.error('Webhook failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <PageHeader title={zone?.label ?? 'Place'} subtitle="Safe zone details" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {zone ? <SafeZoneCard zone={zone} /> : null}
        <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, lineHeight: 22, marginTop: 16 }}>
          Coordinates: {zone?.latitude?.toFixed(5)}, {zone?.longitude?.toFixed(5)}
        </Text>
        
        <View style={{ marginTop: 24 }}>
          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Simulate Geofence (for testing phase 4)</Text>
          <Button title="Simulate Enter" onPress={() => triggerWebhook('enter')} loading={loading} style={{ marginBottom: 8 }} />
          <Button title="Simulate Exit" variant="secondary" onPress={() => triggerWebhook('exit')} loading={loading} />
        </View>
      </ScrollView>
    </Screen>
  );
}
