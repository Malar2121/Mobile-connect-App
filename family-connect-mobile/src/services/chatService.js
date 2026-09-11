import { api } from './api';
import { normalizeApiError as normalizeAxiosError, apiFailure } from './apiError';
import { enqueueOfflineRequest, isNetworkError } from '../utils/offlineQueue';
import { translate } from '../i18n';

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
    if (!data.success) throw apiFailure(data);
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
      if (!data.success || !data.data) throw apiFailure(data);
      return data.data;
    }

    const body = { text: trimmed };
    if (options.replyTo) body.replyTo = String(options.replyTo);

    const { data } = await api.post('/chat/send', body);
    if (!data.success || !data.data) throw apiFailure(data);
    return data.data;
  } catch (e) {
    // BUG-M2 fix: text messages sent while offline are queued and replayed
    // by the offline queue once connectivity returns (media is not queued —
    // local file URIs may not survive an app restart).
    if (!options.mediaUri && isNetworkError(e) && text?.trim()) {
      await enqueueOfflineRequest({
        type: 'chat_message',
        payload: { text: text.trim(), ...(options.replyTo ? { replyTo: String(options.replyTo) } : {}) },
      }).catch(() => {});
      const queuedErr = new Error(translate('chat.queuedOffline'));
      queuedErr.queued = true;
      throw queuedErr;
    }
    throw normalizeAxiosError(e);
  }
}

export async function deleteMessage(messageId) {
  try {
    const { data } = await api.delete(`/chat/${messageId}`);
    if (!data.success) throw apiFailure(data);
    return true;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function editMessage(messageId, text) {
  try {
    const { data } = await api.patch(`/chat/${messageId}`, { text });
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function reactToMessage(messageId, emoji) {
  try {
    const { data } = await api.post(`/chat/${messageId}/react`, { emoji });
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function pinMessage(messageId) {
  try {
    const { data } = await api.post(`/chat/${messageId}/pin`);
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function unpinMessage(messageId) {
  try {
    const { data } = await api.delete(`/chat/${messageId}/pin`);
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function toggleStarMessage(messageId) {
  try {
    const { data } = await api.post(`/chat/${messageId}/star`);
    if (!data.success) throw apiFailure(data);
    return data.data;
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function searchChatMessages(filters = {}) {
  try {
    const { data } = await api.get('/chat/search', { params: filters });
    if (!data.success) throw apiFailure(data);
    return data.data ?? [];
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function getPinnedMessages() {
  try {
    const { data } = await api.get('/chat/pinned');
    if (!data.success) throw apiFailure(data);
    return data.data ?? [];
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}

export async function getStarredMessages() {
  try {
    const { data } = await api.get('/chat/starred');
    if (!data.success) throw apiFailure(data);
    return data.data ?? [];
  } catch (e) {
    throw normalizeAxiosError(e);
  }
}
