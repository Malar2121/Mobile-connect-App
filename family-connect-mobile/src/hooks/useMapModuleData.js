import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { useTheme } from './useTheme';
import { getFamilyLocations, updateLocation, sendSOSAlert } from '../services/locationService';
import { connectSocket, subscribeLocationUpdate } from '../socket/socketClient';
import {
  fitRegionToLocations,
  locationsToArray,
  mergeLocationsList,
  upsertLocationInMap,
} from '../utils/locationHelpers';
import {
  appendSosHistory,
  buildMapAnalytics,
  buildTripsFromPoints,
  isInsideZone,
  loadEmergencyContacts,
  loadLocationSettings,
  loadSafeZones,
  loadSosHistory,
  loadTripPoints,
  loadTrips,
  recordTripPoint,
  saveLocationSettings,
  saveSafeZones,
  saveEmergencyContacts,
  saveTrips,
} from '../utils/mapModuleHelpers';

const UPDATE_THROTTLE_MS = 30_000;
const WATCH_OPTIONS = {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 30_000,
  distanceInterval: 50,
};

export function useMapModuleData() {
  const { user, token } = useAuth();
  const { family, members } = useFamily();
  const { uiMode } = useTheme();

  const watchRef = useRef(null);
  const lastSentRef = useRef(0);
  const myCoordsRef = useRef(null);
  const zoneStateRef = useRef({});
  const hasLocationsRef = useRef(false);

  const [locationMap, setLocationMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [sharingBusy, setSharingBusy] = useState(false);
  const [safeZones, setSafeZones] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [sosHistory, setSosHistory] = useState([]);
  const [trips, setTrips] = useState([]);
  const [locationSettings, setLocationSettings] = useState(null);

  const locations = useMemo(() => locationsToArray(locationMap), [locationMap]);
  const myLocation = user?._id ? locationMap[String(user._id)] : null;
  const analytics = useMemo(() => buildMapAnalytics(trips, safeZones), [trips, safeZones]);

  const loadMeta = useCallback(async () => {
    if (!family || !user) return;
    const [zones, contacts, sos, settings, savedTrips] = await Promise.all([
      loadSafeZones(family._id),
      loadEmergencyContacts(family._id),
      loadSosHistory(family._id),
      loadLocationSettings(user._id),
      loadTrips(family._id, user._id),
    ]);
    setSafeZones(zones);
    setEmergencyContacts(contacts);
    setSosHistory(sos);
    setLocationSettings(settings);
    setTrips(savedTrips);
    setSharing(settings?.shareLocation ?? false);
  }, [family, user]);

  const loadFamilyLocations = useCallback(async () => {
    if (!family) {
      setLocationMap({});
      setLoading(false);
      return;
    }
    setError('');
    try {
      const list = await getFamilyLocations();
      setLocationMap((prev) => mergeLocationsList(prev, list));
    } catch (e) {
      setError(e.message || 'Could not load locations.');
    } finally {
      setLoading(false);
    }
  }, [family]);

  const pushLocationUpdate = useCallback(
    async (coords) => {
      const now = Date.now();
      if (now - lastSentRef.current < UPDATE_THROTTLE_MS) return;
      lastSentRef.current = now;
      myCoordsRef.current = coords;

      try {
        const saved = await updateLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          heading: coords.heading,
          speed: coords.speed,
          battery: coords.battery,
        });
        setLocationMap((prev) => upsertLocationInMap(prev, saved));
        await recordTripPoint(user._id, coords);

        safeZones.forEach((zone) => {
          const inside = isInsideZone(coords.latitude, coords.longitude, zone);
          const wasInside = zoneStateRef.current[zone.id];
          if (wasInside === undefined) {
            zoneStateRef.current[zone.id] = inside;
          } else if (wasInside !== inside) {
            zoneStateRef.current[zone.id] = inside;
            // TODO: server geofence notifications
          }
        });
      } catch (e) {
        setError(e.message || 'Could not share location.');
      }
    },
    [user, safeZones],
  );

  const stopWatching = useCallback(async () => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
  }, []);

  const startWatching = useCallback(async () => {
    setSharingBusy(true);
    setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        setSharing(false);
        return;
      }
      setPermissionDenied(false);
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await pushLocationUpdate({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        accuracy: current.coords.accuracy,
        heading: current.coords.heading,
        speed: current.coords.speed,
      });
      await stopWatching();
      watchRef.current = await Location.watchPositionAsync(WATCH_OPTIONS, (pos) => {
        pushLocationUpdate({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
        });
      });
      setSharing(true);
    } catch (e) {
      setError(e.message || 'Could not start location sharing.');
      setSharing(false);
    } finally {
      setSharingBusy(false);
    }
  }, [pushLocationUpdate, stopWatching]);

  const toggleSharing = useCallback(
    async (next) => {
      if (next) await startWatching();
      else {
        setSharing(false);
        await stopWatching();
      }
      if (user?._id) {
        const settings = { ...locationSettings, shareLocation: next };
        setLocationSettings(settings);
        await saveLocationSettings(user._id, settings);
      }
    },
    [startWatching, stopWatching, user, locationSettings],
  );

  const refresh = useCallback(async () => {
    await Promise.all([loadFamilyLocations(), loadMeta()]);
  }, [loadFamilyLocations, loadMeta]);

  useEffect(() => {
    hasLocationsRef.current = Object.keys(locationMap).length > 0;
  }, [locationMap]);

  useFocusEffect(
    useCallback(() => {
      setLoading((prev) => (hasLocationsRef.current ? prev : true));
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    if (!token || !family) return undefined;
    connectSocket(token);
    const unsub = subscribeLocationUpdate((payload) => {
      setLocationMap((prev) => upsertLocationInMap(prev, payload));
    });
    return unsub;
  }, [token, family]);

  useEffect(() => () => { stopWatching(); }, [stopWatching]);

  const sendSOS = useCallback(
    async (message) => {
      const coords = myCoordsRef.current ?? (myLocation ? { latitude: myLocation.latitude, longitude: myLocation.longitude } : null);
      if (!coords) throw new Error('Location unavailable for SOS');
      const result = await sendSOSAlert({ ...coords, message });
      await appendSosHistory(family._id, { ...result, message, userId: user._id, userName: user.fullName });
      const history = await loadSosHistory(family._id);
      setSosHistory(history);
      return result;
    },
    [family, user, myLocation],
  );

  const rebuildTrips = useCallback(async () => {
    if (!user?._id || !family?._id) return;
    const points = await loadTripPoints(user._id);
    const built = buildTripsFromPoints(points);
    setTrips(built);
    await saveTrips(family._id, user._id, built);
  }, [user, family]);

  return {
    user,
    family,
    members,
    locations,
    locationMap,
    myLocation,
    myCoordsRef,
    loading,
    error,
    setError,
    permissionDenied,
    sharing,
    sharingBusy,
    toggleSharing,
    safeZones,
    setSafeZones,
    saveSafeZones: useCallback(async (zones) => {
      await saveSafeZones(family._id, zones);
      setSafeZones(zones);
    }, [family]),
    emergencyContacts,
    setEmergencyContacts,
    saveEmergencyContacts: useCallback(async (c) => {
      await saveEmergencyContacts(family._id, c);
      setEmergencyContacts(c);
    }, [family]),
    sosHistory,
    trips,
    locationSettings,
    setLocationSettings,
    saveSettings: useCallback(async (s) => {
      await saveLocationSettings(user._id, s);
      setLocationSettings(s);
    }, [user]),
    analytics,
    refresh,
    sendSOS,
    rebuildTrips,
    fitRegion: fitRegionToLocations,
    isMinor: uiMode === 'minor',
    isElder: uiMode === 'elder',
  };
}
