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
 * GET /api/memories
 * @returns {object[]}
 */
export async function getFamilyMemories() {
  try {
    const { data } = await api.get('/memories');
    if (!data.success) {
      throw new Error(data.message || 'Could not load memories');
    }
    return Array.isArray(data.data) ? data.data : [];
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * GET /api/memories/:id
 */
export async function getMemoryDetails(id) {
  try {
    const { data } = await api.get(`/memories/${encodeURIComponent(id)}`);
    if (!data.success || !data.data) {
      throw new Error(data.message || 'Memory not found');
    }
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * POST /api/memories/upload — multipart form with field `media`
 * @param {FormData} formData
 * @returns {object} created memory
 */
export async function uploadMemory(formData) {
  try {
    const { data } = await api.post('/memories/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    if (!data.success || !data.data) {
      throw new Error(data.message || 'Could not upload memory');
    }
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * POST /api/memories/like — toggle like
 * @param {string} memoryId
 * @returns {object} updated memory
 */
export async function likeMemory(memoryId) {
  try {
    const { data } = await api.post('/memories/like', { memoryId });
    if (!data.success) {
      throw new Error(data.message || 'Could not like memory');
    }
    return data.data;
  } catch (error) {
    throw normalizeAxiosError(error);
  }
}

/**
 * GET /api/memories/:id/comments
 */
export async function getMemoryComments(id) {
  try {
    const { data } = await api.get(`/memories/${id}/comments`);
    if (!data.success) {
      throw new Error(data.message || 'Could not fetch comments');
    }
    return data.data.comments;
  } catch (error) {
    throw normalizeAxiosError(error);
  }
}

/**
 * POST /api/memories/:id/comments
 */
export async function addMemoryComment(id, content) {
  try {
    const { data } = await api.post(`/memories/${id}/comments`, { content });
    if (!data.success) {
      throw new Error(data.message || 'Could not add comment');
    }
    return data.data.comment;
  } catch (error) {
    throw normalizeAxiosError(error);
  }
}

/**
 * DELETE /api/memories/:id
 * @param {string} memoryId
 */
export async function deleteMemory(memoryId) {
  try {
    const { data } = await api.delete(`/memories/${encodeURIComponent(memoryId)}`);
    if (!data.success) {
      throw new Error(data.message || 'Could not delete memory');
    }
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}
