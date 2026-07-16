import { api } from '../services/api';
import { registerQueueProcessor } from './offlineQueue';

/**
 * Domain processors for the offline retry queue (BUG-M2).
 * Each queued entry carries a `type` + `payload`; a processor returns true
 * once the entry has been replayed successfully so it leaves the queue.
 */
export function registerOfflineProcessors() {
  return registerQueueProcessor(async (item) => {
    if (item.type === 'chat_message') {
      const { data } = await api.post('/chat/send', item.payload);
      return Boolean(data?.success);
    }
    return false;
  });
}
