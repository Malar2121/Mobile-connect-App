import { api } from './api';
import { normalizeApiError as normalizeAxiosError, apiFailure } from './apiError';

/**
 * POST /api/auth/login
 * @returns {{ accessToken: string, refreshToken: string, user: object }}
 */
export async function loginUser(email, password) {
  try {
    const { data } = await api.post('/auth/login', { email, password });
    if (!data.success || !data.data) {
      throw apiFailure(data);
    }
    // Accounts with 2FA enabled get a short-lived tempToken instead of tokens
    if (data.data.requires2FA) {
      return { requires2FA: true, tempToken: data.data.tempToken };
    }
    const { accessToken, refreshToken, user } = data.data;
    return { accessToken, refreshToken, user };
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * POST /api/auth/2fa/login — exchange tempToken + TOTP code for real tokens.
 * @returns {{ accessToken: string, refreshToken: string, user: object }}
 */
export async function loginWith2FA(tempToken, code) {
  try {
    const { data } = await api.post('/auth/2fa/login', { tempToken, code });
    if (!data.success || !data.data) {
      throw apiFailure(data);
    }
    const { accessToken, refreshToken, user } = data.data;
    return { accessToken, refreshToken, user };
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * POST /api/auth/2fa/setup — returns { secret, otpauthUrl } to show in an
 * authenticator app; 2FA activates only after verify2FA succeeds.
 */
export async function setup2FA() {
  try {
    const { data } = await api.post('/auth/2fa/setup');
    if (!data.success || !data.data) {
      throw apiFailure(data);
    }
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * POST /api/auth/2fa/verify — confirm the first TOTP code and enable 2FA.
 */
export async function verify2FA(code) {
  try {
    const { data } = await api.post('/auth/2fa/verify', { code });
    if (!data.success) {
      throw apiFailure(data);
    }
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * POST /api/auth/2fa/disable — requires a valid current TOTP code.
 */
export async function disable2FA(code) {
  try {
    const { data } = await api.post('/auth/2fa/disable', { code });
    if (!data.success) {
      throw apiFailure(data);
    }
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * POST /api/auth/register
 * Backend expects `fullName` — we map `name` to `fullName`.
 * @returns {{ accessToken: string, refreshToken: string, user: object }}
 */
export async function registerUser(name, email, password, memberType = 'adult') {
  try {
    const { data } = await api.post('/auth/register', {
      fullName: name,
      email,
      password,
      memberType,
    });
    if (!data.success || !data.data) {
      throw apiFailure(data);
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
      throw apiFailure(data);
    }
    return data.data.user;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * PATCH /api/auth/me
 */
export async function updateProfile(payload) {
  try {
    const { data } = await api.patch('/auth/me', payload);
    if (!data.success || !data.data?.user) {
      throw apiFailure(data);
    }
    return data.data.user;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}
