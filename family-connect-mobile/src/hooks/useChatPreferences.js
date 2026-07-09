import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@family_connect_chat_prefs';

const DEFAULT_PREFS = {
  pinnedMessageId: null,
  starredIds: [],
  reactions: {},
  muted: false,
  archived: false,
  wallpaper: null,
  scheduledMessages: [],
  editedTexts: {},
  lastReadAt: null,
};

async function loadPrefs(familyId) {
  if (!familyId) return { ...DEFAULT_PREFS };
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_KEY}_${familyId}`);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

async function savePrefs(familyId, prefs) {
  if (!familyId) return;
  try {
    await AsyncStorage.setItem(`${STORAGE_KEY}_${familyId}`, JSON.stringify(prefs));
  } catch {
    /* best-effort */
  }
}

export function useChatPreferences(familyId) {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadPrefs(familyId).then((loaded) => {
      if (mounted) {
        setPrefs(loaded);
        setReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, [familyId]);

  const update = useCallback(
    async (patch) => {
      setPrefs((prev) => {
        const next = { ...prev, ...patch };
        savePrefs(familyId, next);
        return next;
      });
    },
    [familyId],
  );

  const pinMessage = useCallback(
    (messageId) => update({ pinnedMessageId: messageId }),
    [update],
  );

  const unpinMessage = useCallback(() => update({ pinnedMessageId: null }), [update]);

  const toggleStar = useCallback(
    (messageId) => {
      setPrefs((prev) => {
        const id = String(messageId);
        const starred = prev.starredIds.includes(id)
          ? prev.starredIds.filter((s) => s !== id)
          : [...prev.starredIds, id];
        const next = { ...prev, starredIds: starred };
        savePrefs(familyId, next);
        return next;
      });
    },
    [familyId],
  );

  const addReaction = useCallback(
    (messageId, emoji, userId) => {
      setPrefs((prev) => {
        const id = String(messageId);
        const existing = prev.reactions[id] ?? [];
        const withoutUser = existing.filter((r) => r.userId !== String(userId));
        const nextReactions = {
          ...prev.reactions,
          [id]: [...withoutUser, { emoji, userId: String(userId) }],
        };
        const next = { ...prev, reactions: nextReactions };
        savePrefs(familyId, next);
        return next;
      });
    },
    [familyId],
  );

  const setEditedText = useCallback(
    (messageId, text) => {
      setPrefs((prev) => {
        const next = {
          ...prev,
          editedTexts: { ...prev.editedTexts, [String(messageId)]: text },
        };
        savePrefs(familyId, next);
        return next;
      });
    },
    [familyId],
  );

  const scheduleMessage = useCallback(
    (entry) => {
      setPrefs((prev) => {
        const next = {
          ...prev,
          scheduledMessages: [...prev.scheduledMessages, entry],
        };
        savePrefs(familyId, next);
        return next;
      });
    },
    [familyId],
  );

  const removeScheduled = useCallback(
    (id) => {
      setPrefs((prev) => {
        const next = {
          ...prev,
          scheduledMessages: prev.scheduledMessages.filter((s) => s.id !== id),
        };
        savePrefs(familyId, next);
        return next;
      });
    },
    [familyId],
  );

  const setWallpaper = useCallback((uri) => update({ wallpaper: uri }), [update]);
  const setMuted = useCallback((muted) => update({ muted }), [update]);
  const setArchived = useCallback((archived) => update({ archived }), [update]);
  const setLastReadAt = useCallback((ts) => update({ lastReadAt: ts }), [update]);

  return {
    prefs,
    ready,
    pinMessage,
    unpinMessage,
    toggleStar,
    addReaction,
    setEditedText,
    scheduleMessage,
    removeScheduled,
    setWallpaper,
    setMuted,
    setArchived,
    setLastReadAt,
  };
}
