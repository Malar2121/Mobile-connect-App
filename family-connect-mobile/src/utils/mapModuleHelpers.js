import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatLastActive } from './locationHelpers';

const ZONES_KEY = (familyId) => `fc_safe_zones_${familyId}`;
const CONTACTS_KEY = (familyId) => `fc_emergency_contacts_${familyId}`;
const SOS_KEY = (familyId) => `fc_sos_history_${familyId}`;
const TRIPS_KEY = (familyId, userId) => `fc_trips_${familyId}_${userId}`;
const SETTINGS_KEY = (userId) => `fc_location_settings_${userId}`;
const TRIP_POINTS_KEY = (userId) => `fc_trip_points_${userId}`;

export const ZONE_PRESETS = [
  { id: 'home', label: 'Home', icon: 'home', color: '#6366F1' },
  { id: 'school', label: 'School', icon: 'school', color: '#10B981' },
  { id: 'office', label: 'Office', icon: 'business', color: '#F59E0B' },
  { id: 'hospital', label: 'Hospital', icon: 'medical', color: '#EF4444' },
  { id: 'custom', label: 'Custom', icon: 'location', color: '#8B5CF6' },
];

export const DEFAULT_LOCATION_SETTINGS = {
  shareLocation: true,
  visibility: 'family',
  backgroundTracking: false,
  highPrecision: true,
  batteryOptimization: true,
  notifyZones: true,
};

const ONLINE_MS = 15 * 60 * 1000;

export function isLocationOnline(updatedAt) {
  if (!updatedAt) return false;
  return Date.now() - new Date(updatedAt).getTime() < ONLINE_MS;
}

export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km) {
  if (km == null || Number.isNaN(km)) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatSpeed(speedMps) {
  if (speedMps == null) return null;
  const kmh = speedMps * 3.6;
  return `${kmh.toFixed(0)} km/h`;
}

export function getTravelStatus(speed) {
  if (speed == null) return 'Stationary';
  if (speed < 0.5) return 'Stationary';
  if (speed < 3) return 'Walking';
  if (speed < 15) return 'Cycling';
  return 'Driving';
}

export function estimateEtaMinutes(distanceKm, speedMps = 13.9) {
  if (!distanceKm || distanceKm <= 0) return null;
  const hours = distanceKm / (speedMps * 3.6);
  return Math.max(1, Math.round(hours * 60));
}

export function clusterMarkers(locations, thresholdKm = 0.05) {
  const clusters = [];
  const used = new Set();

  locations.forEach((loc, i) => {
    if (used.has(i)) return;
    const cluster = [loc];
    used.add(i);
    locations.forEach((other, j) => {
      if (i === j || used.has(j)) return;
      const d = haversineKm(loc.latitude, loc.longitude, other.latitude, other.longitude);
      if (d < thresholdKm) {
        cluster.push(other);
        used.add(j);
      }
    });
    clusters.push(cluster);
  });
  return clusters;
}

export function buildMapAnalytics(trips, zones) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTrips = (trips ?? []).filter((t) => new Date(t.startedAt) >= today);
  const distanceToday = todayTrips.reduce((s, t) => s + (t.distanceKm ?? 0), 0);
  const visited = new Set();
  todayTrips.forEach((t) => (t.waypoints ?? []).forEach((w) => visited.add(w.label ?? w.id)));

  const placeCounts = {};
  (trips ?? []).forEach((t) => {
    (t.waypoints ?? []).forEach((w) => {
      const k = w.label ?? 'Unknown';
      placeCounts[k] = (placeCounts[k] ?? 0) + 1;
    });
  });
  const mostVisited = Object.entries(placeCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    distanceTodayKm: Math.round(distanceToday * 10) / 10,
    tripsToday: todayTrips.length,
    visitedPlaces: visited.size,
    mostVisited: mostVisited?.[0] ?? '—',
    mostVisitedCount: mostVisited?.[1] ?? 0,
    travelTimeMin: todayTrips.reduce((s, t) => s + (t.durationMin ?? 0), 0),
    safeZoneCount: zones?.length ?? 0,
  };
}

export function isInsideZone(lat, lng, zone) {
  if (!zone?.latitude || !zone?.longitude) return false;
  const radiusKm = (zone.radiusM ?? 200) / 1000;
  return haversineKm(lat, lng, zone.latitude, zone.longitude) <= radiusKm;
}

export async function loadSafeZones(familyId) {
  if (!familyId) return [];
  try {
    const raw = await AsyncStorage.getItem(ZONES_KEY(familyId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveSafeZones(familyId, zones) {
  if (!familyId) return;
  await AsyncStorage.setItem(ZONES_KEY(familyId), JSON.stringify(zones));
}

export async function loadEmergencyContacts(familyId) {
  if (!familyId) return [];
  try {
    const raw = await AsyncStorage.getItem(CONTACTS_KEY(familyId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveEmergencyContacts(familyId, contacts) {
  if (!familyId) return;
  await AsyncStorage.setItem(CONTACTS_KEY(familyId), JSON.stringify(contacts));
}

export async function loadSosHistory(familyId) {
  if (!familyId) return [];
  try {
    const raw = await AsyncStorage.getItem(SOS_KEY(familyId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function appendSosHistory(familyId, entry) {
  if (!familyId) return;
  const list = await loadSosHistory(familyId);
  list.unshift({ ...entry, id: `sos-${Date.now()}` });
  await AsyncStorage.setItem(SOS_KEY(familyId), JSON.stringify(list.slice(0, 50)));
}

export async function loadTrips(familyId, userId) {
  if (!familyId || !userId) return [];
  try {
    const raw = await AsyncStorage.getItem(TRIPS_KEY(familyId, userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveTrips(familyId, userId, trips) {
  if (!familyId || !userId) return;
  await AsyncStorage.setItem(TRIPS_KEY(familyId, userId), JSON.stringify(trips));
}

export async function loadLocationSettings(userId) {
  if (!userId) return { ...DEFAULT_LOCATION_SETTINGS };
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY(userId));
    return raw ? { ...DEFAULT_LOCATION_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_LOCATION_SETTINGS };
  } catch {
    return { ...DEFAULT_LOCATION_SETTINGS };
  }
}

export async function saveLocationSettings(userId, settings) {
  if (!userId) return;
  await AsyncStorage.setItem(SETTINGS_KEY(userId), JSON.stringify(settings));
}

export async function loadTripPoints(userId) {
  if (!userId) return [];
  try {
    const raw = await AsyncStorage.getItem(TRIP_POINTS_KEY(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function recordTripPoint(userId, point) {
  if (!userId || !point) return loadTripPoints(userId);
  try {
    const raw = await AsyncStorage.getItem(TRIP_POINTS_KEY(userId));
    const points = raw ? JSON.parse(raw) : [];
    points.push({ ...point, at: new Date().toISOString() });
    const trimmed = points.slice(-500);
    await AsyncStorage.setItem(TRIP_POINTS_KEY(userId), JSON.stringify(trimmed));
    return trimmed;
  } catch {
    return [];
  }
}

export function buildTripsFromPoints(points, minDistanceKm = 0.3) {
  if (!points?.length) return [];
  const trips = [];
  let current = null;

  points.forEach((p) => {
    if (!current) {
      current = { startedAt: p.at, waypoints: [{ latitude: p.latitude, longitude: p.longitude, at: p.at }], distanceKm: 0 };
      return;
    }
    const last = current.waypoints[current.waypoints.length - 1];
    const d = haversineKm(last.latitude, last.longitude, p.latitude, p.longitude);
    const gap = new Date(p.at) - new Date(last.at);
    if (gap > 30 * 60 * 1000) {
      if (current.distanceKm >= minDistanceKm) trips.push(finalizeTrip(current));
      current = { startedAt: p.at, waypoints: [{ latitude: p.latitude, longitude: p.longitude, at: p.at }], distanceKm: 0 };
    } else {
      current.distanceKm += d;
      current.waypoints.push({ latitude: p.latitude, longitude: p.longitude, at: p.at });
    }
  });
  if (current && current.distanceKm >= minDistanceKm) trips.push(finalizeTrip(current));
  return trips.reverse();
}

function finalizeTrip(trip) {
  const start = new Date(trip.startedAt);
  const end = new Date(trip.waypoints[trip.waypoints.length - 1].at);
  const durationMin = Math.round((end - start) / 60000);
  const avgSpeed = durationMin > 0 ? (trip.distanceKm / (durationMin / 60)) : 0;
  return {
    id: `trip-${start.getTime()}`,
    startedAt: trip.startedAt,
    endedAt: trip.waypoints[trip.waypoints.length - 1].at,
    distanceKm: Math.round(trip.distanceKm * 100) / 100,
    durationMin,
    avgSpeedKmh: Math.round(avgSpeed * 10) / 10,
    waypoints: trip.waypoints,
  };
}

export function memberLocationSummary(location, myLat, myLng) {
  const online = isLocationOnline(location?.updatedAt);
  const distance = myLat != null ? haversineKm(myLat, myLng, location.latitude, location.longitude) : null;
  return {
    online,
    lastActive: formatLastActive(location?.updatedAt),
    distanceKm: distance,
    distanceLabel: formatDistance(distance),
    travelStatus: getTravelStatus(location?.speed),
    speedLabel: formatSpeed(location?.speed),
    battery: location?.battery,
    accuracy: location?.accuracy,
    heading: location?.heading,
    etaMin: estimateEtaMinutes(distance),
  };
}
