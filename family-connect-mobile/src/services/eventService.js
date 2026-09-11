import { api } from './api';
import { normalizeApiError as normalizeAxiosError, apiFailure } from './apiError';

/**
 * GET /api/events
 * @returns {object[]}
 */
export async function getFamilyEvents() {
  try {
    const { data } = await api.get('/events');
    if (!data.success) {
      throw apiFailure(data);
    }
    return Array.isArray(data.data) ? data.data : [];
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * GET /api/events/:id
 */
export async function getEventDetails(id) {
  try {
    const { data } = await api.get(`/events/${encodeURIComponent(id)}`);
    if (!data.success || !data.data) {
      throw apiFailure(data);
    }
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * POST /api/events/create
 * @param {object} payload — { title, description?, date?, startTime?, endTime?, location?, image? }
 */
export async function createEvent(payload) {
  try {
    const { data } = await api.post('/events/create', payload);
    if (!data.success || !data.data) {
      throw apiFailure(data);
    }
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * POST /api/events/respond
 * @param {string} id — eventId
 * @param {'accepted' | 'declined' | 'maybe'} status
 */
export async function respondToEvent(id, status) {
  try {
    const { data } = await api.post('/events/respond', {
      eventId: id,
      status,
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
 * DELETE /api/events/:id
 */
export async function deleteEvent(id) {
  try {
    const { data } = await api.delete(`/events/${encodeURIComponent(id)}`);
    if (!data.success) {
      throw apiFailure(data);
    }
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * PATCH /api/events/:id
 */
export async function updateEvent(eventId, eventData) {
  try {
    const { data } = await api.patch(`/events/${eventId}`, eventData);
    if (!data.success) {
      throw apiFailure(data);
    }
    return data.data;
  } catch (error) {
    throw normalizeAxiosError(error);
  }
}

/**
 * GET /api/events/:id/comments
 * Get comments for an event
 */
export async function getEventComments(eventId) {
  try {
    const { data } = await api.get(`/events/${eventId}/comments`);
    if (!data.success) {
      throw apiFailure(data);
    }
    return data.data.comments;
  } catch (error) {
    throw normalizeAxiosError(error);
  }
}

/**
 * POST /api/events/:id/comments
 * Add a comment to an event
 */
export async function addEventComment(eventId, content) {
  try {
    const { data } = await api.post(`/events/${eventId}/comments`, { content });
    if (!data.success) {
      throw apiFailure(data);
    }
    return data.data.comment;
  } catch (error) {
    throw normalizeAxiosError(error);
  }
}
