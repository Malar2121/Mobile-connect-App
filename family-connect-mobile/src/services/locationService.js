import { api } from './api';
import { normalizeApiError as normalizeAxiosError, apiFailure } from './apiError';

export async function getFamilyLocations() {
  try {
    const { data } = await api.get('/location/family');
    if (!data.success) throw apiFailure(data);
    return Array.isArray(data.data) ? data.data : [];
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function getUserLocation(userId) {
  try {
    const { data } = await api.get(`/location/${encodeURIComponent(userId)}`);
    if (!data.success || !data.data) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function updateLocation(coords) {
  try {
    const { data } = await api.post('/location/update', coords);
    if (!data.success || !data.data) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function sendSOSAlert(payload) {
  try {
    const { data } = await api.post('/location/sos', payload);
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

// ─── Sharing (pause/resume — children & elders cannot pause) ───

export async function setLocationSharing(enabled) {
  try {
    const { data } = await api.post('/location/sharing', { enabled });
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

// ─── Location history (server trail, powers trips & member details) ───

export async function getLocationHistory(userId, hours = 24) {
  try {
    const { data } = await api.get(`/location/history/${encodeURIComponent(userId)}?hours=${hours}`);
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

// ─── Safe zones (server-persisted geofences) ───

export async function getSafeZones() {
  try {
    const { data } = await api.get('/safezones');
    if (!data.success) throw apiFailure(data);
    return Array.isArray(data.data) ? data.data : [];
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function createSafeZone(zone) {
  try {
    const { data } = await api.post('/safezones', zone);
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function updateSafeZone(zoneId, updates) {
  try {
    const { data } = await api.put(`/safezones/${encodeURIComponent(zoneId)}`, updates);
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function deleteSafeZone(zoneId) {
  try {
    const { data } = await api.delete(`/safezones/${encodeURIComponent(zoneId)}`);
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}
