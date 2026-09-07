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
 * GET /api/celebrations?days=365
 * Returns upcoming celebrations already sorted by how soon they fall.
 * Birthdays come back as virtual entries derived from each member's
 * dateOfBirth — they are not stored records and cannot be edited here.
 */
export async function getCelebrations(days = 365) {
  try {
    const { data } = await api.get('/celebrations', { params: { days } });
    if (!data.success) throw new Error(data.message || 'Could not load celebrations');
    return Array.isArray(data.data) ? data.data : [];
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * POST /api/celebrations
 * @param {{type:'anniversary'|'cultural'|'other', title:string, date:string,
 *          description?:string, recurrence?:'annual'|'once',
 *          relatedMembers?:string[], reminderDaysBefore?:number[]}} payload
 */
export async function createCelebration(payload) {
  try {
    const { data } = await api.post('/celebrations', payload);
    if (!data.success) throw new Error(data.message || 'Could not create celebration');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function getCelebration(id) {
  try {
    const { data } = await api.get(`/celebrations/${encodeURIComponent(id)}`);
    if (!data.success) throw new Error(data.message || 'Celebration not found');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function updateCelebration(id, payload) {
  try {
    const { data } = await api.put(`/celebrations/${encodeURIComponent(id)}`, payload);
    if (!data.success) throw new Error(data.message || 'Could not update celebration');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function deleteCelebration(id) {
  try {
    const { data } = await api.delete(`/celebrations/${encodeURIComponent(id)}`);
    if (!data.success) throw new Error(data.message || 'Could not delete celebration');
    return true;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}
