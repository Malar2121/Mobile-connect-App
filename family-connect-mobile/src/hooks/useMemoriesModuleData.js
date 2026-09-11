import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { useTheme } from './useTheme';
import { useI18n } from '../i18n';
import { getFamilyMemories, getPendingMemories } from '../services/memoryService';
import { getAlbums } from '../services/albumService';
import { canReviewMemories, isSharedMemory, isUploadedBy } from '../utils/memoryHelpers';
import {
  buildMemoryAnalytics,
  filterPhotos,
  filterVideos,
  getFeaturedMemories,
  getOnThisDayMemories,
  groupTimelineByYearMonth,
  loadLegacyProfiles,
  loadViewCounts,
  searchMemories,
} from '../utils/memoryModuleHelpers';

export function useMemoriesModuleData(searchFilters = {}) {
  const { user } = useAuth();
  const { members, family } = useFamily();
  const { uiMode } = useTheme();
  const { t } = useI18n();
  const reviewer = canReviewMemories(user);

  // Everything the API returned: approved memories plus the user's own
  // pending or rejected uploads (proposal §8).
  const [allMemories, setAllMemories] = useState([]);
  const [pendingReview, setPendingReview] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [viewCounts, setViewCounts] = useState({});
  const [legacyProfiles, setLegacyProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!family) {
      setAllMemories([]);
      setPendingReview([]);
      setAlbums([]);
      setLoading(false);
      return;
    }
    setError('');
    try {
      const [mem, alb, counts, legacy, queue] = await Promise.all([
        getFamilyMemories(),
        getAlbums().then((r) => r.albums).catch(() => []),
        loadViewCounts(family._id),
        loadLegacyProfiles(family._id),
        reviewer ? getPendingMemories().catch(() => []) : Promise.resolve([]),
      ]);
      setAllMemories(mem);
      setPendingReview(queue);
      setAlbums(alb);
      setViewCounts(counts);
      setLegacyProfiles(legacy);
    } catch (e) {
      setError(e.message || t('memories.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [family, reviewer, t]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      setLoading((prev) => (allMemories.length ? prev : true));
      load();
    }, [load, allMemories.length]),
  );

  // Shared views only ever show memories the family is allowed to see.
  const memories = useMemo(() => allMemories.filter(isSharedMemory), [allMemories]);
  const myHiddenUploads = useMemo(
    () => allMemories.filter((m) => !isSharedMemory(m) && isUploadedBy(m, user)),
    [allMemories, user],
  );

  const photos = useMemo(() => filterPhotos(memories), [memories]);
  const videos = useMemo(() => filterVideos(memories), [memories]);
  const recentMemories = useMemo(() => memories.slice(0, 12), [memories]);
  const onThisDay = useMemo(() => getOnThisDayMemories(memories), [memories]);
  const featured = useMemo(() => getFeaturedMemories(memories, viewCounts), [memories, viewCounts]);
  const timeline = useMemo(() => groupTimelineByYearMonth(memories), [memories]);
  const filtered = useMemo(
    () => searchMemories(memories, searchFilters),
    [memories, searchFilters],
  );
  const analytics = useMemo(
    () => buildMemoryAnalytics(memories, albums, members, viewCounts),
    [memories, albums, members, viewCounts],
  );

  return {
    memories,
    myHiddenUploads,
    pendingReview,
    canReview: reviewer,
    albums,
    members,
    family,
    user,
    loading,
    refreshing,
    error,
    refresh,
    load,
    photos,
    videos,
    recentMemories,
    onThisDay,
    featured,
    timeline,
    filtered,
    analytics,
    viewCounts,
    legacyProfiles,
    setLegacyProfiles,
    isMinor: uiMode === 'minor',
    noFamily: !family,
  };
}
