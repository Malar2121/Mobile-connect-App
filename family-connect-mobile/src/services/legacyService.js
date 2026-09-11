import { api } from './api';
import { normalizeApiError as normalizeAxiosError, apiFailure } from './apiError';

export async function getLegacyProfiles() {
  try {
    const { data } = await api.get('/legacy');
    if (!data.success) throw apiFailure(data);
    return data.data.profiles;
  } catch (error) {
    throw normalizeAxiosError(error);
  }
}

export async function getLegacyProfile(id) {
  try {
    const { data } = await api.get(`/legacy/${id}`);
    if (!data.success) throw apiFailure(data);
    return data.data.profile;
  } catch (error) {
    throw normalizeAxiosError(error);
  }
}

export async function createLegacyProfile(payload) {
  try {
    const { data } = await api.post('/legacy', payload);
    if (!data.success) throw apiFailure(data);
    return data.data.profile;
  } catch (error) {
    throw normalizeAxiosError(error);
  }
}

export async function addTribute(id, content) {
  try {
    const { data } = await api.post(`/legacy/${id}/tributes`, { content });
    if (!data.success) throw apiFailure(data);
    return data.data.profile;
  } catch (error) {
    throw normalizeAxiosError(error);
  }
}
