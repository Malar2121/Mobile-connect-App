export function normalizeLocation(raw) {
  if (!raw) return null;

  const user = raw.userId;
  const userId = user && typeof user === 'object' ? user._id : user;

  return {
    id: String(raw._id ?? `${userId}-${raw.latitude}-${raw.longitude}`),
    userId: String(userId),
    user:
      user && typeof user === 'object'
        ? user
        : { fullName: 'Family member', avatar: null, _id: userId },
    latitude: Number(raw.latitude),
    longitude: Number(raw.longitude),
    accuracy: raw.accuracy != null ? Number(raw.accuracy) : null,
    heading: raw.heading != null ? Number(raw.heading) : null,
    speed: raw.speed != null ? Number(raw.speed) : null,
    battery: raw.battery != null ? Number(raw.battery) : null,
    memberType: (user && typeof user === 'object' ? user.memberType : null) ?? raw.memberType ?? null,
    updatedAt: raw.updatedAt ?? raw.lastUpdated ?? raw.createdAt ?? null,
  };
}

export function locationsToArray(map) {
  return Object.values(map ?? {}).filter(Boolean);
}

export function mergeLocationsList(existingMap, list) {
  const next = { ...existingMap };
  (list ?? []).forEach((item) => {
    const n = normalizeLocation(item);
    if (n) next[n.userId] = n;
  });
  return next;
}

export function upsertLocationInMap(existingMap, raw) {
  const n = normalizeLocation(raw);
  if (!n) return existingMap;
  return { ...existingMap, [n.userId]: n };
}

export function formatLastActive(dateVal) {
  if (!dateVal) return 'Unknown';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return 'Unknown';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  if (diffMs < 60_000) return 'Just now';
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;

  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function fitRegionToLocations(locations, padding = 0.08) {
  const points = locations.filter(
    (l) => Number.isFinite(l.latitude) && Number.isFinite(l.longitude),
  );
  if (points.length === 0) {
    return {
      latitude: 0,
      longitude: 0,
      latitudeDelta: 50,
      longitudeDelta: 50,
    };
  }

  if (points.length === 1) {
    return {
      latitude: points[0].latitude,
      longitude: points[0].longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLng = points[0].longitude;
  let maxLng = points[0].longitude;

  points.forEach((p) => {
    minLat = Math.min(minLat, p.latitude);
    maxLat = Math.max(maxLat, p.latitude);
    minLng = Math.min(minLng, p.longitude);
    maxLng = Math.max(maxLng, p.longitude);
  });

  const latDelta = Math.max((maxLat - minLat) * (1 + padding), 0.02);
  const lngDelta = Math.max((maxLng - minLng) * (1 + padding), 0.02);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

export const MAP_DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
];
