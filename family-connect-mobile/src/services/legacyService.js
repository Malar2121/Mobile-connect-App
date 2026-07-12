import api, { normalizeAxiosError } from './api';

export async function getLegacyProfiles() {
  try {
    const { data } = await api.get('/legacy');
    if (!data.success) throw new Error(data.message || 'Failed to get profiles');
    return data.data.profiles;
  } catch (error) {
    throw normalizeAxiosError(error);
  }
}

export async function getLegacyProfile(id) {
  try {
    const { data } = await api.get(`/legacy/${id}`);
    if (!data.success) throw new Error(data.message || 'Failed to get profile');
    return data.data.profile;
  } catch (error) {
    throw normalizeAxiosError(error);
  }
}

export async function createLegacyProfile(payload) {
  try {
    const { data } = await api.post('/legacy', payload);
    if (!data.success) throw new Error(data.message || 'Failed to create profile');
    return data.data.profile;
  } catch (error) {
    throw normalizeAxiosError(error);
  }
}

export async function addTribute(id, content) {
  try {
    const { data } = await api.post(`/legacy/${id}/tributes`, { content });
    if (!data.success) throw new Error(data.message || 'Failed to add tribute');
    return data.data.profile;
  } catch (error) {
    throw normalizeAxiosError(error);
  }
}
