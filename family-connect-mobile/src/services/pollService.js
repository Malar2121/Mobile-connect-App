import { api } from './api';

function normalizeAxiosError(error) {
  if (error.response) {
    const msg = error.response.data?.message || `Server error (${error.response.status})`;
    const err = new Error(msg);
    err.status = error.response.status;
    return err;
  }
  if (error.request) {
    return new Error('Network error. Check your connection and EXPO_PUBLIC_API_URL.');
  }
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * POST /api/polls
 */
export async function createPoll({ eventId, question, options, deadline }) {
  try {
    const { data } = await api.post('/polls', { eventId, question, options, deadline });
    if (!data.success || !data.data?.poll) {
      throw new Error(data.message || 'Could not create poll');
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
      throw new Error(data.message || 'Poll not found');
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
      throw new Error(data.message || 'No poll for this event');
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
      throw new Error(data.message || 'Could not cast vote');
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
      throw new Error(data.message || 'Could not close poll');
    }
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}
