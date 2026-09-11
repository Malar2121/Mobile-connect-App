import { api } from './api';
import { normalizeApiError as normalizeAxiosError, apiFailure } from './apiError';

/**
 * GET /api/family-tree
 * @returns {{ nodes: object[] }}
 */
export async function getFamilyTree() {
  try {
    const { data } = await api.get('/family-tree');
    if (!data.success) {
      throw apiFailure(data);
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
      throw apiFailure(data);
    }
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}
