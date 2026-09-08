import { api } from './api';

function normalizeAxiosError(error) {
  if (error.response) {
    const err = new Error(error.response.data?.message || `Server error (${error.response.status})`);
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
 * POST /api/family/invitations
 * Returns { invitation, emailSent, deliveryReason, mailConfigured, token? }.
 * `token` comes back only when the email could not be delivered, so the
 * inviter can still share the invitation another way.
 */
export async function createEmailInvitation(email, role = 'member') {
  try {
    const { data } = await api.post('/family/invitations', { email, role });
    if (!data.success) throw new Error(data.message || 'Could not create the invitation');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function listInvitations() {
  try {
    const { data } = await api.get('/family/invitations');
    if (!data.success) throw new Error(data.message || 'Could not load invitations');
    return Array.isArray(data.data) ? data.data : [];
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function revokeInvitation(id) {
  try {
    const { data } = await api.delete(`/family/invitations/${encodeURIComponent(id)}`);
    if (!data.success) throw new Error(data.message || 'Could not revoke the invitation');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/** Check an invitation before accepting, so the app can name the family. */
export async function verifyInvitation(token) {
  try {
    const { data } = await api.get(`/family/invitations/verify/${encodeURIComponent(token)}`);
    if (!data.success) throw new Error(data.message || 'This invitation is not valid');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function acceptInvitation(token) {
  try {
    const { data } = await api.post('/family/invitations/accept', { token });
    if (!data.success) throw new Error(data.message || 'Could not accept the invitation');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}
