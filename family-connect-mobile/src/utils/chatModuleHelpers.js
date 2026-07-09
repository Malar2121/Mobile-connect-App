import {
  getSender,
  getSenderId,
  getMediaMessages,
  searchMessages as localSearchMessages,
} from './chatHelpers';

export const SEARCH_FILTERS = [
  { id: 'text', label: 'Text' },
  { id: 'media', label: 'Media' },
  { id: 'document', label: 'Documents' },
  { id: 'audio', label: 'Audio' },
  { id: 'link', label: 'Links' },
  { id: 'member', label: 'Members' },
  { id: 'date', label: 'Dates' },
];

export function getMessageReactions(message, localReactions = {}) {
  if (message?.reactions?.length) {
    return message.reactions.map((r) => ({
      emoji: r.emoji,
      userId: String(r.userId?._id ?? r.userId),
    }));
  }
  return localReactions[String(message?._id)] ?? [];
}

export function isMessageStarred(message, userId, localStarredIds = []) {
  const uid = String(userId);
  if ((message?.starredBy ?? []).some((id) => String(id._id ?? id) === uid)) return true;
  return localStarredIds.includes(String(message?._id));
}

export function getPinnedMessage(messages) {
  const pinned = (messages ?? []).filter((m) => m.pinnedAt);
  if (!pinned.length) return null;
  return pinned.sort((a, b) => new Date(b.pinnedAt) - new Date(a.pinnedAt))[0];
}

export function groupSharedFiles(messages) {
  const groups = { images: [], videos: [], documents: [], audio: [] };
  (messages ?? []).forEach((m) => {
    if (!m.mediaUrl) return;
    if (m.mediaType === 'image') groups.images.push(m);
    else if (m.mediaType === 'video') groups.videos.push(m);
    else if (m.mediaType === 'document') groups.documents.push(m);
    else if (m.mediaType === 'audio') groups.audio.push(m);
  });
  return groups;
}

export function shouldHidePreview(message, uiMode) {
  if (uiMode !== 'minor') return false;
  if (message.mediaType === 'image' || message.mediaType === 'video') return true;
  const text = message.text ?? '';
  return /https?:\/\//i.test(text);
}

export function getPreviewLabel(message, uiMode) {
  if (!shouldHidePreview(message, uiMode)) return null;
  if (message.mediaType === 'image') return 'Photo hidden in minor mode';
  if (message.mediaType === 'video') return 'Video hidden in minor mode';
  return 'Link hidden in minor mode';
}

export function buildSearchParams({ query, filter, memberId, date }) {
  if (filter === 'member' && memberId) return { type: 'member', memberId };
  if (filter === 'date' && date) return { type: 'date', date };
  if (filter === 'media') return { type: 'media', q: query };
  if (filter === 'document') return { type: 'document', q: query };
  if (filter === 'audio') return { type: 'audio', q: query };
  if (filter === 'link') return { type: 'link', q: query };
  return { type: 'text', q: query };
}

export function mergeSearchResults(localMessages, serverResults, query, editedTexts) {
  if (serverResults?.length) return serverResults;
  return localSearchMessages(localMessages, query, editedTexts);
}

export function formatDuration(seconds) {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function extractLinks(text) {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s]+/gi);
  return matches ?? [];
}

export function getReplyPreview(message) {
  if (!message) return null;
  const reply = message.replyTo;
  if (!reply || typeof reply !== 'object') return null;
  return {
    id: reply._id,
    text: reply.text,
    senderName: getSender(reply).fullName,
    mediaType: reply.mediaType,
  };
}

export function getChatAnalytics(messages, members) {
  return {
    total: messages?.length ?? 0,
    media: getMediaMessages(messages).length,
    documents: (messages ?? []).filter((m) => m.mediaType === 'document').length,
    audio: (messages ?? []).filter((m) => m.mediaType === 'audio').length,
    members: members?.length ?? 0,
  };
}

export { getMediaMessages, getSender, getSenderId };
