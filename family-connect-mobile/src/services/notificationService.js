import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const PUSH_TOKEN_KEY = 'fc_push_token';

function normalizeAxiosError(error) {
  if (error.response) {
    const msg =
      error.response.data?.message ||
      `Server error (${error.response.status})`;
    const err = new Error(msg);
    err.status = error.response.status;
    return err;
  }
  if (error.request) {
    return new Error(
      'Network error. Check your connection and EXPO_PUBLIC_API_URL.',
    );
  }
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * GET /api/notifications
 * @returns {object[]}
 */
export async function getNotifications() {
  try {
    const { data } = await api.get('/notifications');
    if (!data.success) {
      throw new Error(data.message || 'Could not load notifications');
    }
    return Array.isArray(data.data) ? data.data : [];
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * PUT /api/notifications/read/:id
 * @param {string} id
 * @returns {object}
 */
export async function markNotificationRead(id) {
  try {
    const { data } = await api.put(`/notifications/read/${encodeURIComponent(id)}`);
    if (!data.success || !data.data) {
      throw new Error(data.message || 'Could not mark notification as read');
    }
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * Persist push token locally.
 */
export async function savePushTokenLocally(token) {
  if (token) {
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
  }
}

/**
 * Read cached push token.
 */
export async function getCachedPushToken() {
  return AsyncStorage.getItem(PUSH_TOKEN_KEY);
}

/**
 * POST device token to backend when supported (FCM native token).
 * Fails silently if the endpoint is not implemented yet.
 */
export async function registerPushTokenWithBackend(token) {
  if (!token) return false;

  const device =
    Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

  try {
    await api.post('/notifications/register-device', { token, device });
    return true;
  } catch (e) {
    if (e.response?.status === 404 || e.response?.status === 405) {
      return false;
    }
    return false;
  }
}
