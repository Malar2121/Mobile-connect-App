import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUploaderId, getLikeCount } from './memoryHelpers';

const META_KEY = (id) => `fc_memory_meta_${id}`;
const LEGACY_KEY = (familyId) => `fc_legacy_profiles_${familyId}`;
const VIEWS_KEY = (familyId) => `fc_memory_views_${familyId}`;

export async function loadMemoryMeta(memoryId) {
  try {
    const raw = await AsyncStorage.getItem(META_KEY(memoryId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveMemoryMeta(memoryId, meta) {
  await AsyncStorage.setItem(META_KEY(memoryId), JSON.stringify(meta));
}

export async function loadLegacyProfiles(familyId) {
  if (!familyId) return [];
  try {
    const raw = await AsyncStorage.getItem(LEGACY_KEY(familyId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveLegacyProfiles(familyId, profiles) {
  if (!familyId) return;
  await AsyncStorage.setItem(LEGACY_KEY(familyId), JSON.stringify(profiles));
}

export async function incrementMemoryView(familyId, memoryId) {
  if (!familyId || !memoryId) return 0;
  try {
    const raw = await AsyncStorage.getItem(VIEWS_KEY(familyId));
    const map = raw ? JSON.parse(raw) : {};
    map[memoryId] = (map[memoryId] ?? 0) + 1;
    await AsyncStorage.setItem(VIEWS_KEY(familyId), JSON.stringify(map));
    return map[memoryId];
  } catch {
    return 0;
  }
}

export async function loadViewCounts(familyId) {
  if (!familyId) return {};
  try {
    const raw = await AsyncStorage.getItem(VIEWS_KEY(familyId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function filterPhotos(memories) {
  return (memories ?? []).filter((m) => m.mediaType === 'image');
}

export function filterVideos(memories) {
  return (memories ?? []).filter((m) => m.mediaType === 'video');
}

export function getOnThisDayMemories(memories) {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  return (memories ?? []).filter((m) => {
    if (!m.createdAt) return false;
    const d = new Date(m.createdAt);
    return d.getMonth() === month && d.getDate() === day && d.getFullYear() < now.getFullYear();
  });
}

export function getFeaturedMemories(memories, viewCounts, limit = 5) {
  return [...(memories ?? [])]
    .sort((a, b) => {
      const scoreA = (viewCounts[String(a._id)] ?? 0) * 2 + getLikeCount(a);
      const scoreB = (viewCounts[String(b._id)] ?? 0) * 2 + getLikeCount(b);
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

export function getMostViewedMemory(memories, viewCounts) {
  let top = null;
  let topViews = 0;
  (memories ?? []).forEach((m) => {
    const v = viewCounts[String(m._id)] ?? 0;
    if (v > topViews) {
      topViews = v;
      top = m;
    }
  });
  return top;
}

export function groupTimelineByYearMonth(memories) {
  const groups = {};
  (memories ?? []).forEach((m) => {
    const d = m.createdAt ? new Date(m.createdAt) : new Date();
    const year = d.getFullYear();
    const month = d.toLocaleString(undefined, { month: 'long' });
    const key = `${year}-${month}`;
    if (!groups[key]) groups[key] = { year, month, label: `${month} ${year}`, items: [] };
    groups[key].items.push(m);
  });
  return Object.values(groups).sort((a, b) => b.year - a.year || b.month.localeCompare(a.month));
}

export function searchMemories(memories, { query, year, memberId, albumId, hasLocation }) {
  let list = [...(memories ?? [])];
  const q = query?.trim().toLowerCase();

  if (q) {
    list = list.filter(
      (m) =>
        m.caption?.toLowerCase().includes(q) ||
        m.album?.toString?.().toLowerCase().includes(q) ||
        getUploaderId(m) === q,
    );
  }

  if (year) {
    list = list.filter((m) => m.createdAt && new Date(m.createdAt).getFullYear() === Number(year));
  }

  if (memberId) {
    const id = String(memberId);
    list = list.filter(
      (m) =>
        getUploaderId(m) === id ||
        (m.tags ?? []).some((t) => String(t._id ?? t) === id),
    );
  }

  if (albumId) {
    list = list.filter((m) => String(m.album ?? '') === String(albumId));
  }

  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function buildMemoryAnalytics(memories, albums, members, viewCounts) {
  const photos = filterPhotos(memories);
  const videos = filterVideos(memories);
  const uploadCounts = {};
  (memories ?? []).forEach((m) => {
    const id = getUploaderId(m);
    if (id) uploadCounts[id] = (uploadCounts[id] ?? 0) + 1;
  });
  let topId = null;
  let topCount = 0;
  Object.entries(uploadCounts).forEach(([id, count]) => {
    if (count > topCount) {
      topCount = count;
      topId = id;
    }
  });
  const topMember = (members ?? []).find((m) => String(m._id) === topId);
  const oldest = [...(memories ?? [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
  const mostViewed = getMostViewedMemory(memories, viewCounts);

  const weekCounts = Array(7).fill(0);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  (memories ?? []).forEach((m) => {
    if (!m.createdAt) return;
    const d = new Date(m.createdAt);
    if (d >= weekStart) {
      const idx = Math.min(6, Math.floor((d - weekStart) / 86400000));
      weekCounts[idx] += 1;
    }
  });

  return {
    totalMemories: memories?.length ?? 0,
    totalPhotos: photos.length,
    totalVideos: videos.length,
    totalAlbums: albums?.length ?? 0,
    mostActiveContributor: topMember?.fullName ?? '—',
    mostActiveAvatar: topMember?.avatar,
    oldestMemory: oldest,
    mostViewed,
    weekCounts,
  };
}

export function getTaggedMemoriesForMember(memories, memberId) {
  const id = String(memberId);
  return (memories ?? []).filter(
    (m) =>
      getUploaderId(m) === id ||
      (m.tags ?? []).some((t) => String(t._id ?? t) === id),
  );
}

export function getAlbumCoverUri(album) {
  const cover = album?.coverMemory;
  if (cover && typeof cover === 'object') return cover.mediaUrl;
  return null;
}

export function getMemoriesForLegacyMember(memories, memberId) {
  return getTaggedMemoriesForMember(memories, memberId);
}
