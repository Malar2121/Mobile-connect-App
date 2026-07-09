import { api } from './api';

function normalizeAxiosError(error) {
  if (error.response) {
    const msg = error.response.data?.message || `Server error (${error.response.status})`;
    const err = new Error(msg);
    err.status = error.response.status;
    return err;
  }
  if (error.request) {
    return new Error('Network error. Check your connection and EXPO_PUBLIC_API_URL.');
  }
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * GET /api/family-tree
 * @returns {{ nodes: object[] }}
 */
export async function getFamilyTree() {
  try {
    const { data } = await api.get('/family-tree');
    if (!data.success) {
      throw new Error(data.message || 'Could not load family tree');
    }
    return data.data?.nodes ?? [];
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * PUT /api/family-tree/relationship
 * @param {{ userId: string, relationshipType?: string, relatedToUserId?: string, nickname?: string }} payload
 */
export async function updateMemberRelationship(payload) {
  try {
    const { data } = await api.put('/family-tree/relationship', payload);
    if (!data.success) {
      throw new Error(data.message || 'Could not update relationship');
    }
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}
