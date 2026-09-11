import { api } from './api';
import { normalizeApiError as normalizeAxiosError, apiFailure } from './apiError';

/**
 * GET /api/memories
 * @returns {object[]}
 */
export async function getFamilyMemories() {
  try {
    const { data } = await api.get('/memories');
    if (!data.success) {
      throw apiFailure(data);
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
      throw apiFailure(data);
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
      throw apiFailure(data);
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
      throw apiFailure(data);
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
      throw apiFailure(data);
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
      throw apiFailure(data);
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
      throw apiFailure(data);
    }
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * GET /api/memories/pending — other members' uploads awaiting approval.
 * @returns {object[]}
 */
export async function getPendingMemories() {
  try {
    const { data } = await api.get('/memories/pending');
    return Array.isArray(data?.data) ? data.data : [];
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * POST /api/memories/:id/approve or /reject (proposal §8).
 * @param {string} memoryId
 * @param {'approve' | 'reject'} decision
 * @returns {object} the reviewed memory
 */
export async function reviewMemory(memoryId, decision) {
  try {
    const action = decision === 'approve' ? 'approve' : 'reject';
    const { data } = await api.post(`/memories/${encodeURIComponent(memoryId)}/${action}`);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}
