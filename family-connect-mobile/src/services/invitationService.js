import { api } from './api';
import { normalizeApiError as normalizeAxiosError, apiFailure } from './apiError';

/**
 * POST /api/family/invitations
 * Returns { invitation, emailSent, deliveryReason, mailConfigured, token? }.
 * `token` comes back only when the email could not be delivered, so the
 * inviter can still share the invitation another way.
 */
export async function createEmailInvitation(email, role = 'member') {
  try {
    const { data } = await api.post('/family/invitations', { email, role });
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function listInvitations() {
  try {
    const { data } = await api.get('/family/invitations');
    if (!data.success) throw apiFailure(data);
    return Array.isArray(data.data) ? data.data : [];
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function revokeInvitation(id) {
  try {
    const { data } = await api.delete(`/family/invitations/${encodeURIComponent(id)}`);
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/** Check an invitation before accepting, so the app can name the family. */
export async function verifyInvitation(token) {
  try {
    const { data } = await api.get(`/family/invitations/verify/${encodeURIComponent(token)}`);
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function acceptInvitation(token) {
  try {
    const { data } = await api.post('/family/invitations/accept', { token });
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}
