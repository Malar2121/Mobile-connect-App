import { api } from './api';
import { normalizeApiError as normalizeAxiosError, apiFailure } from './apiError';

/**
 * GET /api/celebrations?days=365
 * Returns upcoming celebrations already sorted by how soon they fall.
 * Birthdays come back as virtual entries derived from each member's
 * dateOfBirth — they are not stored records and cannot be edited here.
 */
export async function getCelebrations(days = 365) {
  try {
    const { data } = await api.get('/celebrations', { params: { days } });
    if (!data.success) throw apiFailure(data);
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
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function getCelebration(id) {
  try {
    const { data } = await api.get(`/celebrations/${encodeURIComponent(id)}`);
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function updateCelebration(id, payload) {
  try {
    const { data } = await api.put(`/celebrations/${encodeURIComponent(id)}`, payload);
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function deleteCelebration(id) {
  try {
    const { data } = await api.delete(`/celebrations/${encodeURIComponent(id)}`);
    if (!data.success) throw apiFailure(data);
    return true;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}
