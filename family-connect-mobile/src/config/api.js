/**
 * @deprecated Use `API_ORIGIN` from `src/services/api.js` and env `EXPO_PUBLIC_API_URL`.
 */
import { API_ORIGIN } from '../services/api';

export const API_CONFIG = {
  BASE_URL: API_ORIGIN,
  TIMEOUT_MS: 15000,
};
