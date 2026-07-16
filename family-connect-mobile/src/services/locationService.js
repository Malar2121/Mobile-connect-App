import { api } from './api';

function normalizeAxiosError(error) {
  if (error.response) {
    const msg = error.response.data?.message || `Server error (${error.response.status})`;
    const err = new Error(msg);
    err.status = error.response.status;
    return err;
  }
  if (error.request) {
    return new Error('Network error. Check your connection and EXPO_PUBLIC_API_URL.');
  }
  return error instanceof Error ? error : new Error(String(error));
}

export async function getFamilyLocations() {
  try {
    const { data } = await api.get('/location/family');
    if (!data.success) throw new Error(data.message || 'Could not load family locations');
    return Array.isArray(data.data) ? data.data : [];
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function getUserLocation(userId) {
  try {
    const { data } = await api.get(`/location/${encodeURIComponent(userId)}`);
    if (!data.success || !data.data) throw new Error(data.message || 'Location not available');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function updateLocation(coords) {
  try {
    const { data } = await api.post('/location/update', coords);
    if (!data.success || !data.data) throw new Error(data.message || 'Could not update location');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function sendSOSAlert(payload) {
  try {
    const { data } = await api.post('/location/sos', payload);
    if (!data.success) throw new Error(data.message || 'Could not send SOS');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

// ─── Sharing (pause/resume — children & elders cannot pause) ───

export async function setLocationSharing(enabled) {
  try {
    const { data } = await api.post('/location/sharing', { enabled });
    if (!data.success) throw new Error(data.message || 'Could not update sharing');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

// ─── Location history (server trail, powers trips & member details) ───

export async function getLocationHistory(userId, hours = 24) {
  try {
    const { data } = await api.get(`/location/history/${encodeURIComponent(userId)}?hours=${hours}`);
    if (!data.success) throw new Error(data.message || 'Could not load history');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

// ─── Safe zones (server-persisted geofences) ───

export async function getSafeZones() {
  try {
    const { data } = await api.get('/safezones');
    if (!data.success) throw new Error(data.message || 'Could not load safe zones');
    return Array.isArray(data.data) ? data.data : [];
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function createSafeZone(zone) {
  try {
    const { data } = await api.post('/safezones', zone);
    if (!data.success) throw new Error(data.message || 'Could not create safe zone');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function updateSafeZone(zoneId, updates) {
  try {
    const { data } = await api.put(`/safezones/${encodeURIComponent(zoneId)}`, updates);
    if (!data.success) throw new Error(data.message || 'Could not update safe zone');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function deleteSafeZone(zoneId) {
  try {
    const { data } = await api.delete(`/safezones/${encodeURIComponent(zoneId)}`);
    if (!data.success) throw new Error(data.message || 'Could not delete safe zone');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}
