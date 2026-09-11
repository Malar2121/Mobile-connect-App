import { api } from './api';
import { normalizeApiError as normalizeAxiosError, apiFailure } from './apiError';

/**
 * POST /api/polls
 */
export async function createPoll({ eventId, question, options, deadline }) {
  try {
    const { data } = await api.post('/polls', { eventId, question, options, deadline });
    if (!data.success || !data.data?.poll) {
      throw apiFailure(data);
    }
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * GET /api/polls/:pollId
 */
export async function getPoll(pollId) {
  try {
    const { data } = await api.get(`/polls/${encodeURIComponent(pollId)}`);
    if (!data.success || !data.data?.poll) {
      throw apiFailure(data);
    }
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * GET /api/polls/event/:eventId
 */
export async function getPollByEvent(eventId) {
  try {
    const { data } = await api.get(`/polls/event/${encodeURIComponent(eventId)}`);
    if (!data.success || !data.data?.poll) {
      throw apiFailure(data);
    }
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * POST /api/polls/:pollId/vote
 */
export async function castPollVote(pollId, optionId, vote) {
  try {
    const { data } = await api.post(`/polls/${encodeURIComponent(pollId)}/vote`, { optionId, vote });
    if (!data.success) {
      throw apiFailure(data);
    }
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * POST /api/polls/:pollId/close
 */
export async function closePoll(pollId, selectedOptionId) {
  try {
    const { data } = await api.post(`/polls/${encodeURIComponent(pollId)}/close`, {
      selectedOptionId,
    });
    if (!data.success) {
      throw apiFailure(data);
    }
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}
