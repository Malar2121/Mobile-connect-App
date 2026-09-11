import { api } from './api';
import { normalizeApiError as normalizeAxiosError, apiFailure } from './apiError';

export async function getAlbums(page = 1, limit = 20) {
  try {
    const { data } = await api.get('/albums', { params: { page, limit } });
    if (!data.success) throw apiFailure(data);
    return { albums: Array.isArray(data.data) ? data.data : [], pagination: data.pagination };
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function getAlbum(id, page = 1, limit = 30) {
  try {
    const { data } = await api.get(`/albums/${encodeURIComponent(id)}`, { params: { page, limit } });
    if (!data.success || !data.data?.album) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function createAlbum({ title, description, eventId }) {
  try {
    const { data } = await api.post('/albums', { title, description, eventId });
    if (!data.success || !data.data?.album) throw apiFailure(data);
    return data.data.album;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function updateAlbum(id, payload) {
  try {
    const { data } = await api.put(`/albums/${encodeURIComponent(id)}`, payload);
    if (!data.success) throw apiFailure(data);
    return data.data?.album;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function addMediaToAlbum(albumId, memoryIds) {
  try {
    const { data } = await api.post(`/albums/${encodeURIComponent(albumId)}/add-media`, { memoryIds });
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function shareAlbum(albumId) {
  try {
    const { data } = await api.post(`/albums/${encodeURIComponent(albumId)}/share`);
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function deleteAlbum(id) {
  try {
    const { data } = await api.delete(`/albums/${encodeURIComponent(id)}`);
    if (!data.success) throw apiFailure(data);
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}
