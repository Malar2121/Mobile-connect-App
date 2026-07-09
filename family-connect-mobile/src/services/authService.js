import { api } from './api';

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
 * POST /api/auth/login
 * @returns {{ accessToken: string, refreshToken: string, user: object }}
 */
export async function loginUser(email, password) {
  try {
    const { data } = await api.post('/auth/login', { email, password });
    if (!data.success || !data.data) {
      throw new Error(data.message || 'Login failed');
    }
    const { accessToken, refreshToken, user } = data.data;
    return { accessToken, refreshToken, user };
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * POST /api/auth/register
 * Backend expects `fullName` — we map `name` to `fullName`.
 * @returns {{ accessToken: string, refreshToken: string, user: object }}
 */
export async function registerUser(name, email, password) {
  try {
    const { data } = await api.post('/auth/register', {
      fullName: name,
      email,
      password,
    });
    if (!data.success || !data.data) {
      throw new Error(data.message || 'Registration failed');
    }
    const { accessToken, refreshToken, user } = data.data;
    return { accessToken, refreshToken, user };
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * GET /api/auth/me — requires `Authorization: Bearer` (set via setAuthToken).
 */
export async function getCurrentUser() {
  try {
    const { data } = await api.get('/auth/me');
    if (!data.success || !data.data?.user) {
      throw new Error(data.message || 'Could not load profile');
    }
    return data.data.user;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}
