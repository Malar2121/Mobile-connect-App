import { api } from './api';

/**
 * Family stories, event notes and the shared family history journal
 * (proposal Objective 4 and §6.3). Screens show translated messages; the
 * error `code` and `status` are kept for decisions.
 */

export const STORY_CATEGORIES = ['story', 'tradition', 'origin', 'milestone', 'recipe'];
export const STORY_LIMITS = { title: 120, body: 5000 };
export const HISTORY_FIELDS = ['origins', 'traditions', 'culturalNotes', 'importantEvents', 'achievements', 'historicalMemories'];
export const HISTORY_FIELD_MAX = 5000;

function normalizeAxiosError(error) {
  if (error.response) {
    const err = new Error(error.response.data?.message || `HTTP ${error.response.status}`);
    err.status = error.response.status;
    err.code = error.response.data?.code;
    return err;
  }
  if (error.request) {
    const err = new Error('Network error');
    err.isNetworkError = true;
    return err;
  }
  return error instanceof Error ? error : new Error(String(error));
}

async function call(request) {
  try {
    const { data } = await request();
    return data;
  } catch (error) {
    throw normalizeAxiosError(error);
  }
}

/** GET /api/stories */
export async function listStories({ category } = {}) {
  const data = await call(() => api.get('/stories', { params: category ? { category } : undefined }));
  return Array.isArray(data?.data) ? data.data : [];
}

/** GET /api/stories/:id */
export async function getStory(id) {
  const data = await call(() => api.get(`/stories/${encodeURIComponent(id)}`));
  return data.data;
}

/** POST /api/stories */
export async function createStory(payload) {
  const data = await call(() => api.post('/stories', payload));
  return data.data;
}

/** PUT /api/stories/:id */
export async function updateStory(id, payload) {
  const data = await call(() => api.put(`/stories/${encodeURIComponent(id)}`, payload));
  return data.data;
}

/** DELETE /api/stories/:id */
export async function deleteStory(id) {
  await call(() => api.delete(`/stories/${encodeURIComponent(id)}`));
}

/** GET /api/events/notes — recent notes across the family's events */
export async function getRecentEventNotes(limit = 50) {
  const data = await call(() => api.get('/events/notes', { params: { limit } }));
  return Array.isArray(data?.data) ? data.data : [];
}

/** GET /api/family/history — the shared family history journal */
export async function getFamilyHistory() {
  const data = await call(() => api.get('/family/history'));
  return data.data;
}

/** PUT /api/family/history */
export async function updateFamilyHistory(history) {
  const payload = {};
  HISTORY_FIELDS.forEach((field) => {
    if (history?.[field] !== undefined) payload[field] = history[field];
  });
  const data = await call(() => api.put('/family/history', payload));
  return data.data;
}
