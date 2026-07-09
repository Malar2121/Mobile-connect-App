import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { useTheme } from './useTheme';
import { getFamilyMemories } from '../services/memoryService';
import { getAlbums } from '../services/albumService';
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

  const [memories, setMemories] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [viewCounts, setViewCounts] = useState({});
  const [legacyProfiles, setLegacyProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!family) {
      setMemories([]);
      setAlbums([]);
      setLoading(false);
      return;
    }
    setError('');
    try {
      const [mem, alb, views, legacy] = await Promise.all([
        getFamilyMemories(),
        getAlbums().then((r) => r.albums).catch(() => []),
        loadViewCounts(family._id),
        loadLegacyProfiles(family._id),
      ]);
      setMemories(mem);
      setAlbums(alb);
      setViewCounts(views);
      setLegacyProfiles(legacy);
    } catch (e) {
      setError(e.message || 'Could not load memories.');
    } finally {
      setLoading(false);
    }
  }, [family]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      setLoading((prev) => (memories.length ? prev : true));
      load();
    }, [load, memories.length]),
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
