import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import MapView, { Circle } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../design-system';
import { useMapModule } from '../../contexts/MapModuleContext';
import { MemberMarker, MapSkeleton, TravelStatsCard, SOSButton } from '../../components/map';
import { useTheme } from '../../hooks/useTheme';
import { MAP_DARK_STYLE } from '../../utils/locationHelpers';

const SHORTCUTS = [
  { id: 'zones', label: 'Safe zones', icon: 'shield', screen: 'SafeZones' },
  { id: 'sos', label: 'SOS', icon: 'warning', screen: 'SOSScreen' },
  { id: 'trips', label: 'Trips', icon: 'car', screen: 'TripHistory' },
  { id: 'settings', label: 'Settings', icon: 'settings', screen: 'LocationSettings' },
];

export default function LiveFamilyMapScreen() {
  const navigation = useNavigation();
  const { colors, layout, isDark } = useTheme();
  const mapRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [regionFitted, setRegionFitted] = useState(false);

  const {
    family,
    locations,
    loading,
    error,
    permissionDenied,
    sharing,
    sharingBusy,
    toggleSharing,
    safeZones,
    analytics,
    isMinor,
    isElder,
    myLocation,
  } = useMapModule();

  const titleSize = (isElder ? 26 : 22) * layout.fontScale;

  const fitMap = useCallback(() => {
    if (!locations.length || !mapRef.current) return;
    mapRef.current.fitToCoordinates(
      locations.map((l) => ({ latitude: l.latitude, longitude: l.longitude })),
      { edgePadding: { top: 120, right: 48, bottom: isElder ? 240 : 200, left: 48 }, animated: true },
    );
    setRegionFitted(true);
  }, [locations, isElder]);

  useEffect(() => {
    if (locations.length && !regionFitted) fitMap();
  }, [locations, regionFitted, fitMap]);

  const initialRegion = useMemo(() => {
    if (myLocation) return { latitude: myLocation.latitude, longitude: myLocation.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    if (locations[0]) return { latitude: locations[0].latitude, longitude: locations[0].longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 };
    return { latitude: 37.78825, longitude: -122.4324, latitudeDelta: 0.08, longitudeDelta: 0.08 };
  }, [locations, myLocation]);

  const onMarkerPress = useCallback(
    (loc) => {
      setSelected(loc.userId);
      navigation.navigate('MemberLocationDetails', { userId: loc.userId });
    },
    [navigation],
  );

  if (loading && !locations.length) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <MapSkeleton />
      </SafeAreaView>
    );
  }

  if (!family) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={{ padding: layout.sectionGap }}>
          <Text style={[styles.title, { color: colors.text, fontSize: titleSize }]}>Family safety map</Text>
          <Card style={{ marginTop: layout.sectionGap }}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>Join a family to see the map</Text>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shortcutScroll} contentContainerStyle={{ paddingHorizontal: layout.sectionGap, gap: 8 }}>
        {SHORTCUTS.map((s) => (
          <Pressable key={s.id} onPress={() => navigation.navigate(s.screen)} style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name={s.icon} size={16} color={colors.primary} />
            <Text style={{ color: colors.text, fontSize: 12 * layout.fontScale, marginLeft: 6, fontFamily: 'Inter_600SemiBold' }}>{s.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={[styles.header, { paddingHorizontal: layout.sectionGap }]}>
        <Text style={[styles.title, { color: colors.text, fontSize: titleSize }]}>Live family map</Text>
        <Text style={{ color: colors.textSecondary, marginTop: 4, fontSize: 13 * layout.fontScale }}>
          {locations.length} sharing · {safeZones.length} safe zones
        </Text>

        {permissionDenied ? (
          <Text style={{ color: colors.error, marginTop: 8, fontSize: 13 }}>Enable location permission in settings.</Text>
        ) : null}

        {!isMinor ? (
          <View style={[styles.shareRow, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 10, padding: isElder ? 16 : 12 }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 * layout.fontScale }}>Share my location</Text>
              <Text style={{ color: colors.textSecondary, marginTop: 4, fontSize: 12 }}>Foreground · ~30s updates</Text>
            </View>
            {sharingBusy ? <ActivityIndicator color={colors.primary} /> : (
              <Switch value={sharing} onValueChange={toggleSharing} trackColor={{ false: colors.border, true: colors.primaryMuted }} thumbColor={sharing ? colors.primary : '#f4f3f4'} />
            )}
          </View>
        ) : null}
      </View>

      {error ? <Text style={{ color: colors.error, paddingHorizontal: layout.sectionGap, fontSize: 13 }}>{error}</Text> : null}

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={sharing}
          userInterfaceStyle={isDark ? 'dark' : 'light'}
          customMapStyle={Platform.OS === 'android' && isDark ? MAP_DARK_STYLE : undefined}
        >
          {locations.map((loc) => (
            <MemberMarker key={loc.userId} location={loc} onPress={onMarkerPress} isElder={isElder} isDark={isDark} colors={colors} selected={selected === loc.userId} />
          ))}
          {locations.filter((l) => l.accuracy).map((loc) => (
            <Circle key={`acc-${loc.userId}`} center={{ latitude: loc.latitude, longitude: loc.longitude }} radius={loc.accuracy} fillColor={colors.primary + '18'} strokeColor={colors.primary + '44'} strokeWidth={1} />
          ))}
          {safeZones.filter((z) => z.latitude).map((z) => (
            <Circle key={z.id} center={{ latitude: z.latitude, longitude: z.longitude }} radius={z.radiusM ?? 200} fillColor={(z.color ?? colors.primary) + '22'} strokeColor={z.color ?? colors.primary} strokeWidth={2} />
          ))}
        </MapView>

        <Pressable onPress={fitMap} style={[styles.fitBtn, { backgroundColor: colors.card, borderColor: colors.border, width: isElder ? 52 : 44, height: isElder ? 52 : 44 }]}>
          <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 18 }}>◎</Text>
        </Pressable>

        {!isMinor ? (
          <View style={styles.sosDock}>
            <SOSButton onPress={() => navigation.navigate('SOSScreen')} />
          </View>
        ) : null}
      </View>

      <View style={{ paddingHorizontal: layout.sectionGap, paddingBottom: layout.sectionGap }}>
        <TravelStatsCard analytics={analytics} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  shortcutScroll: { maxHeight: 44, marginBottom: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, marginRight: 8 },
  header: { paddingTop: 4, paddingBottom: 8 },
  title: { fontWeight: '800' },
  shareRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  mapWrap: { flex: 1, position: 'relative', minHeight: 280 },
  map: { flex: 1 },
  fitBtn: { position: 'absolute', right: 16, top: 16, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  sosDock: { position: 'absolute', left: 16, bottom: 16 },
});
