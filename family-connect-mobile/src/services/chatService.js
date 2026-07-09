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

export async function getAllMessages() {
  const { messages } = await getMessages({ limit: 200 });
  return messages;
}

/**
 * GET /api/chat/messages
 * @param {{ limit?: number, before?: string }} [params]
 */
export async function getMessages(params = {}) {
  try {
    const { data } = await api.get('/chat/messages', { params });
    if (!data.success) throw new Error(data.message || 'Could not load messages');
    return {
      messages: Array.isArray(data.data) ? data.data : [],
      hasMore: data.meta?.hasMore ?? false,
    };
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

/**
 * POST /api/chat/send
 */
export async function sendMessage(text, options = {}) {
  try {
    const trimmed = text?.trim() ?? '';

    if (options.mediaUri) {
      const form = new FormData();
      if (trimmed) form.append('text', trimmed);
      if (options.replyTo) form.append('replyTo', String(options.replyTo));
      if (options.mediaDuration) form.append('mediaDuration', String(options.mediaDuration));
      if (options.documentName) form.append('documentName', options.documentName);
      if (options.mediaType) form.append('mediaType', options.mediaType);

      const mime = options.mimeType || 'image/jpeg';
      let ext = 'jpg';
      if (mime.includes('video')) ext = 'mp4';
      else if (mime.includes('audio')) ext = 'm4a';
      else if (mime.includes('pdf')) ext = 'pdf';

      form.append('media', {
        uri: options.mediaUri,
        type: mime,
        name: options.fileName || `chat-${Date.now()}.${ext}`,
      });

      const { data } = await api.post('/chat/send', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000,
      });
      if (!data.success || !data.data) throw new Error(data.message || 'Could not send message');
      return data.data;
    }

    const body = { text: trimmed };
    if (options.replyTo) body.replyTo = String(options.replyTo);

    const { data } = await api.post('/chat/send', body);
    if (!data.success || !data.data) throw new Error(data.message || 'Could not send message');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function deleteMessage(messageId) {
  try {
    const { data } = await api.delete(`/chat/${messageId}`);
    if (!data.success) throw new Error(data.message || 'Could not delete message');
    return true;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function editMessage(messageId, text) {
  try {
    const { data } = await api.patch(`/chat/${messageId}`, { text });
    if (!data.success) throw new Error(data.message || 'Could not edit message');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function reactToMessage(messageId, emoji) {
  try {
    const { data } = await api.post(`/chat/${messageId}/react`, { emoji });
    if (!data.success) throw new Error(data.message || 'Could not react');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function pinMessage(messageId) {
  try {
    const { data } = await api.post(`/chat/${messageId}/pin`);
    if (!data.success) throw new Error(data.message || 'Could not pin message');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function unpinMessage(messageId) {
  try {
    const { data } = await api.delete(`/chat/${messageId}/pin`);
    if (!data.success) throw new Error(data.message || 'Could not unpin message');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function toggleStarMessage(messageId) {
  try {
    const { data } = await api.post(`/chat/${messageId}/star`);
    if (!data.success) throw new Error(data.message || 'Could not star message');
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function searchChatMessages(filters = {}) {
  try {
    const { data } = await api.get('/chat/search', { params: filters });
    if (!data.success) throw new Error(data.message || 'Search failed');
    return data.data ?? [];
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function getPinnedMessages() {
  try {
    const { data } = await api.get('/chat/pinned');
    if (!data.success) throw new Error(data.message || 'Could not load pinned messages');
    return data.data ?? [];
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function getStarredMessages() {
  try {
    const { data } = await api.get('/chat/starred');
    if (!data.success) throw new Error(data.message || 'Could not load starred messages');
    return data.data ?? [];
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}
