import axios from 'axios';

const PRODUCTION_API_ORIGIN = 'https://mobile-connect-app-production.up.railway.app';
const isDevelopment = process.env.NODE_ENV === 'development';
const configuredApiUrl = (process.env.EXPO_PUBLIC_API_URL || '').trim();

const raw = configuredApiUrl || (isDevelopment ? 'http://localhost:5000' : PRODUCTION_API_ORIGIN);

/** Server origin without trailing slash (for Socket.IO, etc.). */
export const API_ORIGIN = raw.replace(/\/$/, '');

/**
 * Axios instance for REST API. Base path includes `/api` (matches Express `app.use('/api/auth', ...)`).
 */
export const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let networkStatusCallback = null;

/** Called by NetworkProvider to reflect connectivity from API results. */
export function bindNetworkStatusCallback(cb) {
  networkStatusCallback = cb;
}

api.interceptors.response.use(
  (response) => {
    networkStatusCallback?.(true);
    return response;
  },
  (error) => {
    if (!error.response) {
      networkStatusCallback?.(false);
      const err = error instanceof Error ? error : new Error('Network error');
      err.isNetworkError = true;
      return Promise.reject(err);
    }
    networkStatusCallback?.(true);
    return Promise.reject(error);
  },
);

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
