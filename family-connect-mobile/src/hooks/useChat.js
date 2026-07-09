import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { deleteMessage, getMessages, sendMessage, editMessage as apiEditMessage, reactToMessage, pinMessage as apiPin, unpinMessage as apiUnpin, toggleStarMessage } from '../services/chatService';
import { connectSocket } from '../socket/socketClient';
import {
  applyReadReceipt,
  createOptimisticMessage,
  getReadByIds,
  getSenderId,
  isMyMessage,
  upsertMessage,
} from '../utils/chatHelpers';
import { getPinnedMessage } from '../utils/chatModuleHelpers';

const PAGE_SIZE = 60;

const TYPING_EMIT_MS = 400;
const TYPING_HIDE_MS = 2500;

export function useChat({ user, token, family, members, prefs, chatActions }) {
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [typingName, setTypingName] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollFab, setShowScrollFab] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mediaGalleryOpen, setMediaGalleryOpen] = useState(false);
  const [activeTypers, setActiveTypers] = useState(new Set());

  const listRef = useRef(null);
  const typingEmitTimer = useRef(null);
  const typingDisplayTimer = useRef(null);
  const typingStopEmitTimer = useRef(null);
  const isTypingRef = useRef(false);
  const scheduleTimers = useRef([]);
  const hasMessagesRef = useRef(false);

  const userId = user?._id;
  const familyMemberCount = members?.length ?? 1;

  const scrollToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd?.({ animated });
    });
  }, []);

  const markUnreadAsRead = useCallback(
    (list) => {
      const socket = connectSocket(token);
      if (!socket?.connected || !userId) return;

      list.forEach((m) => {
        if (isMyMessage(m, userId) || !m._id) return;
        const readIds = getReadByIds(m);
        if (!readIds.includes(String(userId))) {
          socket.emit('mark_read', { messageId: m._id });
        }
      });
    },
    [token, userId],
  );

  const loadHistory = useCallback(async () => {
    if (!family) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setError('');
    try {
      const { messages: list, hasMore: more } = await getMessages({ limit: PAGE_SIZE });
      setMessages(list);
      setHasMore(more);
      markUnreadAsRead(list);
      chatActions?.setLastReadAt?.(new Date().toISOString());
      scrollToBottom(false);
    } catch (e) {
      setError(e.message || 'Could not load chat.');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [family, markUnreadAsRead, scrollToBottom, chatActions]);

  useEffect(() => {
    hasMessagesRef.current = messages.length > 0;
  }, [messages.length]);

  useFocusEffect(
    useCallback(() => {
      setLoading((prev) => (hasMessagesRef.current ? prev : true));
      loadHistory();
    }, [loadHistory]),
  );

  useEffect(() => {
    if (!token || !family) return undefined;

    const socket = connectSocket(token);

    const onNewMessage = (msg) => {
      setMessages((prev) => upsertMessage(prev, msg));
      if (!isMyMessage(msg, userId)) {
        markUnreadAsRead([msg]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      scrollToBottom();
    };

    const onTyping = ({ userId: typerId, name }) => {
      if (String(typerId) === String(userId)) return;
      setTypingName(name || 'Someone');
      setActiveTypers((prev) => new Set(prev).add(String(typerId)));
      if (typingDisplayTimer.current) clearTimeout(typingDisplayTimer.current);
      typingDisplayTimer.current = setTimeout(() => {
        setTypingName('');
        setActiveTypers(new Set());
      }, TYPING_HIDE_MS);
    };

    const onStopTyping = ({ userId: typerId }) => {
      if (String(typerId) === String(userId)) return;
      setTypingName('');
      setActiveTypers((prev) => {
        const next = new Set(prev);
        next.delete(String(typerId));
        return next;
      });
    };

    const onMessageRead = ({ messageId, readerId, userId: readUserId }) => {
      const rid = readerId ?? readUserId;
      setMessages((prev) => applyReadReceipt(prev, messageId, rid));
    };

    const onMessageUpdated = (msg) => {
      setMessages((prev) => upsertMessage(prev, msg));
    };

    const onMessageDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => String(m._id) !== String(messageId)));
    };

    socket.on('new_message', onNewMessage);
    socket.on('typing', onTyping);
    socket.on('stop_typing', onStopTyping);
    socket.on('message_read', onMessageRead);
    socket.on('message_updated', onMessageUpdated);
    socket.on('message_deleted', onMessageDeleted);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('typing', onTyping);
      socket.off('stop_typing', onStopTyping);
      socket.off('message_read', onMessageRead);
      socket.off('message_updated', onMessageUpdated);
      socket.off('message_deleted', onMessageDeleted);
      if (isTypingRef.current) {
        socket.emit('stop_typing');
        isTypingRef.current = false;
      }
    };
  }, [token, family, userId, markUnreadAsRead, scrollToBottom]);

  useEffect(() => {
    return () => {
      if (typingEmitTimer.current) clearTimeout(typingEmitTimer.current);
      if (typingDisplayTimer.current) clearTimeout(typingDisplayTimer.current);
      if (typingStopEmitTimer.current) clearTimeout(typingStopEmitTimer.current);
      scheduleTimers.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!prefs?.scheduledMessages?.length || !user) return undefined;

    prefs.scheduledMessages.forEach((scheduled) => {
      const delay = new Date(scheduled.sendAt).getTime() - Date.now();
      if (delay <= 0) return;

      const timer = setTimeout(async () => {
        try {
          await sendMessage(scheduled.text, scheduled.mediaOptions);
          chatActions?.removeScheduled?.(scheduled.id);
        } catch {
          /* scheduled send failed */
        }
      }, delay);
      scheduleTimers.current.push(timer);
    });

    return () => {
      scheduleTimers.current.forEach(clearTimeout);
      scheduleTimers.current = [];
    };
  }, [prefs?.scheduledMessages, user, chatActions]);

  const emitStopTyping = useCallback(() => {
    if (!token || !isTypingRef.current) return;
    const socket = connectSocket(token);
    socket.emit('stop_typing');
    isTypingRef.current = false;
  }, [token]);

  const handleDraftChange = useCallback(
    (text) => {
      setDraft(text);
      if (!token || !family) return;

      if (!text.trim()) {
        emitStopTyping();
        return;
      }

      if (typingEmitTimer.current) clearTimeout(typingEmitTimer.current);
      typingEmitTimer.current = setTimeout(() => {
        const socket = connectSocket(token);
        if (!isTypingRef.current) {
          socket.emit('typing');
          isTypingRef.current = true;
        }
      }, TYPING_EMIT_MS);

      if (typingStopEmitTimer.current) clearTimeout(typingStopEmitTimer.current);
      typingStopEmitTimer.current = setTimeout(emitStopTyping, TYPING_HIDE_MS);
    },
    [token, family, emitStopTyping],
  );

  const sendTextMessage = useCallback(
    async (text, extras = {}) => {
      if (!text?.trim() || sending || !user) return;

      emitStopTyping();
      setDraft('');
      setSending(true);
      setError('');

      const optimistic = createOptimisticMessage(text, user, {
        replyTo: extras.replyTo ?? replyTo?._id ?? replyTo,
      });
      setMessages((prev) => [...prev, optimistic]);
      setReplyTo(null);
      scrollToBottom();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      try {
        const replyId = extras.replyTo?._id ?? extras.replyTo ?? replyTo?._id ?? replyTo;
        const saved = await sendMessage(text, {
          ...extras.mediaOptions,
          replyTo: replyId,
        });
        setMessages((prev) => upsertMessage(prev, { ...saved, clientId: optimistic.clientId }));
        scrollToBottom();
      } catch (e) {
        setMessages((prev) => prev.filter((m) => m.clientId !== optimistic.clientId));
        setError(e.message || 'Could not send message.');
        setDraft(text);
      } finally {
        setSending(false);
      }
    },
    [sending, user, emitStopTyping, scrollToBottom, replyTo],
  );

  const handleSend = useCallback(() => sendTextMessage(draft), [draft, sendTextMessage]);

  const handleDelete = useCallback(
    async (message) => {
      if (!message?._id) return;
      try {
        await deleteMessage(message._id);
        setMessages((prev) => prev.filter((m) => m._id !== message._id));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } catch (e) {
        setError(e.message || 'Could not delete message.');
      }
    },
    [],
  );

  const handleCopy = useCallback(async (message, editedTexts) => {
    const text = editedTexts?.[String(message._id)] ?? message.text ?? '';
    await Clipboard.setStringAsync(text);
    Haptics.selectionAsync().catch(() => {});
  }, []);

  const handleForward = useCallback(
    (message, editedTexts) => {
      const text = editedTexts?.[String(message._id)] ?? message.text ?? '';
      const prefix = text ? `↪ ${text}` : '↪ Forwarded message';
      sendTextMessage(prefix);
    },
    [sendTextMessage],
  );

  const handleEdit = useCallback(
    async (message, newText) => {
      if (!message?._id || !newText?.trim()) return;
      try {
        const updated = await apiEditMessage(message._id, newText.trim());
        setMessages((prev) => upsertMessage(prev, updated));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {
        chatActions?.setEditedText?.(message._id, newText.trim());
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    },
    [chatActions],
  );

  const loadMore = useCallback(async () => {
    if (!family || loadingMore || !hasMore || !messages.length) return;
    setLoadingMore(true);
    try {
      const before = messages[0]?.createdAt;
      const { messages: older, hasMore: more } = await getMessages({ limit: PAGE_SIZE, before });
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => String(m._id)));
        return [...older.filter((m) => !ids.has(String(m._id))), ...prev];
      });
      setHasMore(more);
    } catch {
      /* pagination failed */
    } finally {
      setLoadingMore(false);
    }
  }, [family, loadingMore, hasMore, messages]);

  const handlePin = useCallback(
    async (message) => {
      if (!message?._id) return;
      try {
        const updated = await apiPin(message._id);
        setMessages((prev) =>
          prev.map((m) => ({
            ...m,
            pinnedAt: String(m._id) === String(updated._id) ? updated.pinnedAt : null,
            pinnedBy: String(m._id) === String(updated._id) ? updated.pinnedBy : null,
          })),
        );
      } catch {
        chatActions?.pinMessage?.(message._id);
      }
    },
    [chatActions],
  );

  const handleUnpin = useCallback(
    async (message) => {
      if (!message?._id) return;
      try {
        await apiUnpin(message._id);
        setMessages((prev) => prev.map((m) => ({ ...m, pinnedAt: null, pinnedBy: null })));
      } catch {
        /* fallback */
      }
      chatActions?.unpinMessage?.();
    },
    [chatActions],
  );

  const handleToggleStar = useCallback(
    async (message) => {
      if (!message?._id) return;
      try {
        const updated = await toggleStarMessage(message._id);
        setMessages((prev) => upsertMessage(prev, updated));
      } catch {
        chatActions?.toggleStar?.(message._id);
      }
    },
    [chatActions],
  );

  const handleReaction = useCallback(
    async (message, emoji) => {
      if (!message?._id) return;
      try {
        const updated = await reactToMessage(message._id, emoji);
        setMessages((prev) => upsertMessage(prev, updated));
      } catch {
        chatActions?.addReaction?.(message._id, emoji, userId);
      }
    },
    [chatActions, userId],
  );

  const handleSchedule = useCallback(
    (text, sendAt) => {
      chatActions?.scheduleMessage?.({
        id: `sched-${Date.now()}`,
        text,
        sendAt,
      });
      setDraft('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    },
    [chatActions],
  );

  const onlineCount = useMemo(() => {
    const base = 1;
    return base + activeTypers.size;
  }, [activeTypers]);

  const pinnedMessage = useMemo(() => {
    const serverPinned = getPinnedMessage(messages);
    if (serverPinned) return serverPinned;
    if (!prefs?.pinnedMessageId) return null;
    return messages.find((m) => String(m._id) === String(prefs.pinnedMessageId)) ?? null;
  }, [messages, prefs?.pinnedMessageId]);

  const handleScroll = useCallback((event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    setShowScrollFab(distanceFromBottom > 120);
  }, []);

  return {
    messages,
    setMessages,
    hasMore,
    loadingMore,
    loadMore,
    draft,
    loading,
    sending,
    error,
    setError,
    typingName,
    replyTo,
    setReplyTo,
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    showScrollFab,
    settingsOpen,
    setSettingsOpen,
    mediaGalleryOpen,
    setMediaGalleryOpen,
    listRef,
    userId,
    familyMemberCount,
    onlineCount,
    pinnedMessage,
    scrollToBottom,
    handleDraftChange,
    handleSend,
    sendTextMessage,
    handleDelete,
    handleCopy,
    handleForward,
    handleEdit,
    handlePin,
    handleUnpin,
    handleToggleStar,
    handleReaction,
    handleSchedule,
    handleScroll,
    loadHistory,
  };
}
