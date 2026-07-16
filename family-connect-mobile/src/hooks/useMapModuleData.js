import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { useTheme } from './useTheme';
import {
  getFamilyLocations,
  updateLocation,
  sendSOSAlert,
  setLocationSharing,
  getSafeZones,
  createSafeZone,
  deleteSafeZone,
} from '../services/locationService';
import { connectSocket, subscribeLocationUpdate, subscribeSocketEvent } from '../socket/socketClient';
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
  loadEmergencyContacts,
  loadLocationSettings,
  loadSosHistory,
  loadTripPoints,
  recordTripPoint,
  saveLocationSettings,
  saveEmergencyContacts,
  saveTrips,
  ZONE_PRESETS,
} from '../utils/mapModuleHelpers';

const UPDATE_THROTTLE_MS = 30_000;
const WATCH_OPTIONS = {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 30_000,
  distanceInterval: 50,
};

// Map server zone types onto the preset icon/colour set used by the UI
const TYPE_PRESET = {
  home: ZONE_PRESETS[0],
  school: ZONE_PRESETS[1],
  work: ZONE_PRESETS[2],
  relative: ZONE_PRESETS[4],
  other: ZONE_PRESETS[4],
};

export function normalizeZone(raw) {
  if (!raw) return null;
  const preset = TYPE_PRESET[raw.type] ?? ZONE_PRESETS[4];
  return {
    id: String(raw._id ?? raw.id),
    _id: raw._id,
    name: raw.name,
    label: raw.name,
    type: raw.type ?? 'other',
    icon: preset.icon,
    color: preset.color,
    latitude: raw.latitude,
    longitude: raw.longitude,
    radius: raw.radius,
    radiusM: raw.radius ?? raw.radiusM ?? 200,
    notifyEnter: raw.notifyOnEnter !== false,
    notifyExit: raw.notifyOnExit !== false,
    appliesTo: raw.appliesTo ?? [],
    createdBy: raw.createdBy ?? null,
  };
}

export function useMapModuleData() {
  const { user, token } = useAuth();
  const { family, members } = useFamily();
  const { uiMode } = useTheme();

  const watchRef = useRef(null);
  const lastSentRef = useRef(0);
  const myCoordsRef = useRef(null);
  const hasLocationsRef = useRef(false);
  const autoShareTriedRef = useRef(false);

  const [locationMap, setLocationMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [sharingBusy, setSharingBusy] = useState(false);
  const [safeZones, setSafeZones] = useState([]);
  const [zoneAlerts, setZoneAlerts] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [sosHistory, setSosHistory] = useState([]);
  const [trips, setTrips] = useState([]);
  const [locationSettings, setLocationSettings] = useState(null);

  const isTrackedMember = user?.memberType === 'child' || user?.memberType === 'elder';

  const locations = useMemo(() => locationsToArray(locationMap), [locationMap]);
  const myLocation = user?._id ? locationMap[String(user._id)] : null;
  const analytics = useMemo(() => buildMapAnalytics(trips, safeZones), [trips, safeZones]);

  const loadSafeZonesFromServer = useCallback(async () => {
    try {
      const zones = await getSafeZones();
      setSafeZones(zones.map(normalizeZone).filter(Boolean));
    } catch {
      // Zones are supplementary — the map still works without them
    }
  }, []);

  const loadMeta = useCallback(async () => {
    if (!family || !user) return;
    const [contacts, sos, settings, points] = await Promise.all([
      loadEmergencyContacts(family._id),
      loadSosHistory(family._id),
      loadLocationSettings(user._id),
      loadTripPoints(user._id),
    ]);
    setEmergencyContacts(contacts);
    setSosHistory(sos);
    setLocationSettings(settings);
    setTrips(buildTripsFromPoints(points));
    await loadSafeZonesFromServer();
  }, [family, user, loadSafeZonesFromServer]);

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
      setError(e.message || 'Could not load family locations.');
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
        // Geofence enter/exit is evaluated by the server on each update;
        // locally we only keep the trip trail.
        await recordTripPoint(user._id, coords);
      } catch (e) {
        setError(e.message || 'Could not share location.');
      }
    },
    [user],
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
        return false;
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
      return true;
    } catch (e) {
      setError(e.message || 'Could not start location sharing.');
      setSharing(false);
      return false;
    } finally {
      setSharingBusy(false);
    }
  }, [pushLocationUpdate, stopWatching]);

  const toggleSharing = useCallback(
    async (next) => {
      // Children and elders cannot pause sharing — safety policy,
      // enforced by the server as well.
      if (!next && isTrackedMember) {
        setError('Location sharing stays on for children and elders — family safety policy.');
        return;
      }
      if (next) {
        const ok = await startWatching();
        if (ok) {
          try {
            await setLocationSharing(true);
          } catch {
            /* sharing preference sync is best-effort */
          }
        }
      } else {
        setSharing(false);
        await stopWatching();
        try {
          await setLocationSharing(false);
        } catch (e) {
          setError(e.message || 'Could not pause sharing.');
        }
      }
      if (user?._id) {
        const settings = { ...locationSettings, shareLocation: next };
        setLocationSettings(settings);
        await saveLocationSettings(user._id, settings);
      }
    },
    [startWatching, stopWatching, user, locationSettings, isTrackedMember],
  );

  // ─── Server-persisted safe zones ───
  const addSafeZone = useCallback(
    async (preset, coords) => {
      const zone = await createSafeZone({
        name: preset.label,
        latitude: coords.latitude,
        longitude: coords.longitude,
        radius: 200,
        type: preset.id === 'office' ? 'work' : preset.id === 'custom' || preset.id === 'hospital' ? 'other' : preset.id,
        notifyOnEnter: true,
        notifyOnExit: true,
      });
      setSafeZones((prev) => [normalizeZone(zone), ...prev]);
      return zone;
    },
    [],
  );

  const removeSafeZone = useCallback(async (zone) => {
    await deleteSafeZone(zone.id ?? zone._id);
    setSafeZones((prev) => prev.filter((z) => z.id !== String(zone.id ?? zone._id)));
  }, []);

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

  // Live socket subscriptions: positions, zone alerts, zone list changes
  useEffect(() => {
    if (!token || !family) return undefined;
    connectSocket(token);
    const unsubs = [
      subscribeLocationUpdate((payload) => {
        setLocationMap((prev) => upsertLocationInMap(prev, payload));
      }),
      subscribeSocketEvent('zone_alert', (payload) => {
        setZoneAlerts((prev) => [{ ...payload, id: `${payload.userId}-${payload.createdAt}` }, ...prev].slice(0, 20));
      }),
      subscribeSocketEvent('safezones_changed', () => {
        loadSafeZonesFromServer();
      }),
      subscribeSocketEvent('location_sharing_changed', ({ userId, isSharing }) => {
        if (!isSharing) {
          setLocationMap((prev) => {
            const next = { ...prev };
            delete next[String(userId)];
            return next;
          });
        }
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [token, family, loadSafeZonesFromServer]);

  // Children and elders share automatically so guardians can always
  // find them (supervisor requirement: elder & child location tracking).
  useEffect(() => {
    if (!family || !user || !isTrackedMember) return;
    if (autoShareTriedRef.current || sharing) return;
    autoShareTriedRef.current = true;
    startWatching();
  }, [family, user, isTrackedMember, sharing, startWatching]);

  useEffect(() => () => { stopWatching(); }, [stopWatching]);

  const sendSOS = useCallback(
    async (message) => {
      let coords = myCoordsRef.current
        ?? (myLocation ? { latitude: myLocation.latitude, longitude: myLocation.longitude } : null);
      if (!coords) {
        // Grab a one-shot fix so SOS works even before sharing is on
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          coords = { latitude: current.coords.latitude, longitude: current.coords.longitude };
        }
      }
      if (!coords) throw new Error('Location unavailable for SOS');
      const result = await sendSOSAlert({ latitude: coords.latitude, longitude: coords.longitude, message });
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
    addSafeZone,
    removeSafeZone,
    reloadSafeZones: loadSafeZonesFromServer,
    zoneAlerts,
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
    isTrackedMember,
  };
}
