import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'fc_offline_request_queue';
const MAX_QUEUE = 50;

/**
 * Persist failed mutating requests for retry when connectivity returns.
 * Production architecture — processors register via registerQueueProcessor.
 */
let processors = [];

export function registerQueueProcessor(processor) {
  processors.push(processor);
  return () => {
    processors = processors.filter((p) => p !== processor);
  };
}

export async function loadOfflineQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function enqueueOfflineRequest(entry) {
  const queue = await loadOfflineQueue();
  queue.push({ ...entry, id: `q-${Date.now()}`, createdAt: new Date().toISOString() });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE)));
}

export async function flushOfflineQueue() {
  const queue = await loadOfflineQueue();
  if (!queue.length || !processors.length) return { flushed: 0, remaining: queue.length };

  const remaining = [];
  let flushed = 0;

  for (const item of queue) {
    let done = false;
    for (const processor of processors) {
      try {
        const ok = await processor(item);
        if (ok) {
          done = true;
          flushed += 1;
          break;
        }
      } catch {
        /* try next processor */
      }
    }
    if (!done) remaining.push(item);
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return { flushed, remaining: remaining.length };
}

export function isNetworkError(error) {
  if (!error) return false;
  if (error.isNetworkError) return true;
  const msg = String(error.message || '').toLowerCase();
  return msg.includes('network error') || error.code === 'ERR_NETWORK' || !error.response;
}
