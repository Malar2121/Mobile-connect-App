import React, { useMemo } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MapModuleProvider } from '../contexts/MapModuleContext';
import { useMapModuleData } from '../hooks/useMapModuleData';
import LiveFamilyMapScreen from '../screens/map/LiveFamilyMapScreen';
import MemberLocationDetailsScreen from '../screens/map/MemberLocationDetailsScreen';
import PlaceDetailsScreen from '../screens/map/PlaceDetailsScreen';
import SafeZonesScreen from '../screens/map/SafeZonesScreen';
import SOSScreen from '../screens/map/SOSScreen';
import EmergencyContactsScreen from '../screens/map/EmergencyContactsScreen';
import DrivingHistoryScreen from '../screens/map/DrivingHistoryScreen';
import TripHistoryScreen from '../screens/map/TripHistoryScreen';
import LocationSettingsScreen from '../screens/map/LocationSettingsScreen';

const Stack = createNativeStackNavigator();

function MapModuleRoot() {
  const mapData = useMapModuleData();
  const value = useMemo(() => mapData, [mapData]);

  return (
    <MapModuleProvider value={value}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="LiveFamilyMap" component={LiveFamilyMapScreen} />
        <Stack.Screen name="MemberLocationDetails" component={MemberLocationDetailsScreen} />
        <Stack.Screen name="PlaceDetails" component={PlaceDetailsScreen} />
        <Stack.Screen name="SafeZones" component={SafeZonesScreen} />
        <Stack.Screen name="SOSScreen" component={SOSScreen} />
        <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
        <Stack.Screen name="DrivingHistory" component={DrivingHistoryScreen} />
        <Stack.Screen name="TripHistory" component={TripHistoryScreen} />
        <Stack.Screen name="LocationSettings" component={LocationSettingsScreen} />
      </Stack.Navigator>
    </MapModuleProvider>
  );
}

export default function MapNavigator() {
  return <MapModuleRoot />;
}
