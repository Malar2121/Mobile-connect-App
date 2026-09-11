import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { normalizeApiError as normalizeAxiosError, apiFailure } from './apiError';

const PUSH_TOKEN_KEY = 'fc_push_token';

/**
 * GET /api/notifications
 * @returns {object[]}
 */
export async function getNotifications() {
  try {
    const { data } = await api.get('/notifications');
    if (!data.success) {
      throw apiFailure(data);
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
      throw apiFailure(data);
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
