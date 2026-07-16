import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const PRODUCTION_API_ORIGIN = 'https://mobile-connect-app-production.up.railway.app';
const isDevelopment = process.env.NODE_ENV === 'development';
const configuredApiUrl = (process.env.EXPO_PUBLIC_API_URL || '').trim();

const raw = configuredApiUrl || (isDevelopment ? 'http://localhost:5000' : PRODUCTION_API_ORIGIN);

/** Server origin without trailing slash (for Socket.IO, etc.). */
export const API_ORIGIN = raw.replace(/\/$/, '');

const TOKEN_KEY = 'fc_auth_token';
const REFRESH_TOKEN_KEY = 'fc_refresh_token';

/**
 * Axios instance for REST API. Base path includes `/api` (matches Express `app.use('/api/auth', ...)`).
 */
export const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let networkStatusCallback = null;
/** Called by AuthProvider when a refresh attempt fails and the session must end. */
let sessionExpiredCallback = null;

/** Called by NetworkProvider to reflect connectivity from API results. */
export function bindNetworkStatusCallback(cb) {
  networkStatusCallback = cb;
}

/** Called by AuthProvider to be notified when silent token refresh fails. */
export function bindSessionExpiredCallback(cb) {
  sessionExpiredCallback = cb;
}

/**
 * Attach or clear JWT for all subsequent requests (`Authorization: Bearer <token>`).
 */
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

// ──────────────────────────────────────────────────────────
// Silent access-token refresh on 401
// ──────────────────────────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

async function performRefresh() {
  const storedRefresh = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!storedRefresh) throw new Error('No refresh token stored');

  // Plain axios call (not the `api` instance) so this request is never
  // intercepted by the 401 handler below — avoids an infinite loop.
  const { data } = await axios.post(`${API_ORIGIN}/api/auth/refresh`, {
    refreshToken: storedRefresh,
  });

  const newAccessToken = data?.data?.accessToken;
  const newRefreshToken = data?.data?.refreshToken;
  if (!newAccessToken) throw new Error('Refresh response missing accessToken');

  await SecureStore.setItemAsync(TOKEN_KEY, newAccessToken);
  if (newRefreshToken) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);
  setAuthToken(newAccessToken);
  return newAccessToken;
}

api.interceptors.response.use(
  (response) => {
    networkStatusCallback?.(true);
    return response;
  },
  async (error) => {
    if (!error.response) {
      networkStatusCallback?.(false);
      const err = error instanceof Error ? error : new Error('Network error');
      err.isNetworkError = true;
      return Promise.reject(err);
    }
    networkStatusCallback?.(true);

    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh');

    // On a 401 from a real protected endpoint (not login/register/refresh itself),
    // try one silent refresh, then retry the original request exactly once.
    if (error.response.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshSubscribers.push((newToken) => {
            if (!newToken) {
              reject(error);
              return;
            }
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const newToken = await performRefresh();
        isRefreshing = false;
        onRefreshed(newToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        onRefreshed(null);
        sessionExpiredCallback?.();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
