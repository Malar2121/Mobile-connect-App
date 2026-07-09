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
