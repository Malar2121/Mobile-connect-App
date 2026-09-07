import { api } from './api';

function normalizeAxiosError(error) {
  if (error.response) {
    const msg =
      error.response.data?.message ||
      `Server error (${error.response.status})`;
    const err = new Error(msg);
    err.status = error.response.status;
    err.code = error.response.data?.code;
    return err;
  }
  if (error.request) {
    return new Error('Network error. Check your connection and EXPO_PUBLIC_API_URL.');
  }
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * GET /api/consent/me — the signed-in account's own consent state.
 * Deliberately reachable while a minor is otherwise gated, so the app can
 * explain why family content is unavailable instead of showing an error.
 */
export async function getMyConsent() {
  try {
    const { data } = await api.get('/consent/me');
    if (!data.success) throw new Error(data.message || 'Could not load consent status');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/** GET /api/consent/pending — guardians (admin or parent) only. */
export async function getPendingConsents() {
  try {
    const { data } = await api.get('/consent/pending');
    if (!data.success) throw new Error(data.message || 'Could not load pending approvals');
    return Array.isArray(data.data) ? data.data : [];
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function approveConsent(id, note) {
  try {
    const { data } = await api.post(`/consent/${encodeURIComponent(id)}/approve`, { note });
    if (!data.success) throw new Error(data.message || 'Could not approve');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function rejectConsent(id, note) {
  try {
    const { data } = await api.post(`/consent/${encodeURIComponent(id)}/reject`, { note });
    if (!data.success) throw new Error(data.message || 'Could not reject');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}
