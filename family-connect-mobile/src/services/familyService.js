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
 * GET /api/family/my-family
 * @returns {{ family: object, memberCount: number }}
 */
export async function getMyFamily() {
  try {
    const { data } = await api.get('/family/my-family');
    if (!data.success || !data.data?.family) {
      throw new Error(data.message || 'Could not load family');
    }
    return {
      family: data.data.family,
      memberCount: data.data.memberCount ?? data.data.family.members?.length ?? 0,
    };
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * POST /api/family/create
 * @returns {{ family: object }}
 */
export async function createFamily(name) {
  try {
    const { data } = await api.post('/family/create', { name: name.trim() });
    if (!data.success || !data.data?.family) {
      throw new Error(data.message || 'Could not create family');
    }
    return { family: data.data.family };
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * POST /api/family/join
 * @returns {{ family?: object, pending?: boolean, message?: string, request?: object }}
 */
export async function joinFamily(inviteCode) {
  try {
    const response = await api.post('/family/join', {
      inviteCode: inviteCode.trim(),
    });
    const { data } = response;
    if (!data.success) {
      throw new Error(data.message || 'Could not join family');
    }
    if (response.status === 202 || data.data?.request) {
      return {
        pending: true,
        request: data.data?.request,
        message: data.message || 'Join request sent. Waiting for admin approval.',
      };
    }
    if (!data.data?.family) {
      throw new Error(data.message || 'Could not join family');
    }
    return { family: data.data.family, pending: false };
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * POST /api/family/invite
 * @param {boolean} [regenerate]
 * @returns {{ familyName: string, inviteCode: string, inviteLink: string, expiresAt: null }}
 */
export async function createInviteCode(regenerate = false) {
  try {
    const body = regenerate ? { regenerate: true } : {};
    const { data } = await api.post('/family/invite', body);
    if (!data.success || !data.data?.inviteCode) {
      throw new Error(data.message || 'Could not get invite code');
    }
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * DELETE /api/family/leave
 */
export async function leaveFamily() {
  try {
    const { data } = await api.delete('/family/leave');
    if (!data.success) {
      throw new Error(data.message || 'Could not leave family');
    }
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function updateFamily(data) {
  try {
    const response = await api.patch('/family', data);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function updateMemberRole(userId, role) {
  try {
    const response = await api.put(`/family/members/${userId}/role`, { role });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function addLifeEvent(userId, lifeEvent) {
  try {
    const response = await api.post(`/family/members/${userId}/life-events`, lifeEvent);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function createJoinRequest(familyId) {
  try {
    const response = await api.post('/family/join-requests', { familyId });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function getJoinRequests() {
  try {
    const response = await api.get('/family/join-requests');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function approveJoinRequest(requestId) {
  try {
    const response = await api.post(`/family/join-requests/${requestId}/approve`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function rejectJoinRequest(requestId) {
  try {
    const response = await api.post(`/family/join-requests/${requestId}/reject`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}
