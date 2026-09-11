import { api } from './api';
import { normalizeApiError as normalizeAxiosError, apiFailure } from './apiError';

/**
 * GET /api/consent/me — the signed-in account's own consent state.
 * Deliberately reachable while a minor is otherwise gated, so the app can
 * explain why family content is unavailable instead of showing an error.
 */
export async function getMyConsent() {
  try {
    const { data } = await api.get('/consent/me');
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/** GET /api/consent/pending — guardians (admin or parent) only. */
export async function getPendingConsents() {
  try {
    const { data } = await api.get('/consent/pending');
    if (!data.success) throw apiFailure(data);
    return Array.isArray(data.data) ? data.data : [];
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function approveConsent(id, note) {
  try {
    const { data } = await api.post(`/consent/${encodeURIComponent(id)}/approve`, { note });
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function rejectConsent(id, note) {
  try {
    const { data } = await api.post(`/consent/${encodeURIComponent(id)}/reject`, { note });
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}
