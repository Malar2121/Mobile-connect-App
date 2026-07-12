import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader, Screen, Avatar, Card } from '../../design-system';
import { useMapModule } from '../../contexts/MapModuleContext';
import { memberLocationSummary } from '../../utils/mapModuleHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function MemberLocationDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const userId = String(route.params?.userId ?? '');
  const { horizontalPadding } = useResponsive();
  const { colors, layout, radii } = useTheme();
  const { locationMap, myLocation, members } = useMapModule();
  const [address, setAddress] = useState('');

  const location = locationMap[userId];
  const member = members?.find((m) => String(m._id) === userId);
  const myLat = myLocation?.latitude;
  const myLng = myLocation?.longitude;

  const summary = useMemo(
    () => (location ? memberLocationSummary(location, myLat, myLng) : null),
    [location, myLat, myLng],
  );

  useEffect(() => {
    if (!location) return;
    Location.reverseGeocodeAsync({ latitude: location.latitude, longitude: location.longitude })
      .then((r) => {
        const a = r[0];
        if (a) setAddress([a.name, a.street, a.city, a.region].filter(Boolean).join(', '));
      })
      .catch(() => setAddress(''));
  }, [location]);

  const openNavigation = useCallback(() => {
    if (!location) return;
    const url = Platform.select({
      ios: `maps:0,0?q=${location.latitude},${location.longitude}`,
      android: `geo:${location.latitude},${location.longitude}?q=${location.latitude},${location.longitude}`,
    });
    if (url) Linking.openURL(url);
  }, [location]);

  if (!location) {
    return (
      <Screen edges={['top']}>
        <PageHeader title="Member" onBack={() => navigation.goBack()} />
        <Text style={{ padding: horizontalPadding, color: colors.textSecondary }}>Location not available.</Text>
      </Screen>
    );
  }

  const name = location.user?.fullName ?? member?.fullName ?? 'Family member';

  return (
    <Screen edges={['top']}>
      <PageHeader title={name} subtitle={summary?.travelStatus} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Avatar uri={location.user?.avatar ?? member?.avatar} name={name} size={72} />
          <View style={[styles.badge, { backgroundColor: summary?.online ? colors.success + '22' : colors.border, borderRadius: radii.full, marginTop: 12 }]}>
            <Text style={{ color: summary?.online ? colors.success : colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>
              {summary?.online ? 'Online' : 'Offline'} · {summary?.lastActive}
            </Text>
          </View>
        </Card>

        <InfoRow icon="location" label="Address" value={address || 'Resolving address…'} colors={colors} />
        <InfoRow icon="navigate" label="Coordinates" value={`${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`} colors={colors} />
        <InfoRow icon="resize" label="Distance" value={summary?.distanceLabel ?? '—'} colors={colors} />
        <InfoRow icon="speedometer" label="Speed" value={summary?.speedLabel ?? '—'} colors={colors} />
        <InfoRow icon="battery-half" label="Battery" value={location.battery != null ? `${location.battery}%` : 'Not reported'} colors={colors} />
        <InfoRow icon="compass" label="Heading" value={location.heading != null ? `${Math.round(location.heading)}°` : '—'} colors={colors} />
        <InfoRow icon="time" label="ETA" value={summary?.etaMin ? `~${summary.etaMin} min` : '—'} colors={colors} />

        <Pressable onPress={openNavigation} style={[styles.navBtn, { backgroundColor: colors.primary, borderRadius: radii.xl, marginTop: 20 }]}>
          <Ionicons name="navigate" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold', marginLeft: 8 }}>Open in Maps</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function InfoRow({ icon, label, value, colors }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Ionicons name={icon} size={18} color={colors.primary} style={{ marginTop: 2 }} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ color: colors.textTertiary, fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>{label.toUpperCase()}</Text>
        <Text style={{ color: colors.text, fontSize: 15, marginTop: 4 }}>{value}</Text>
      </View>
    </View>
  );
}

const styles = {
  badge: { paddingHorizontal: 14, paddingVertical: 6 },
  navBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
};
