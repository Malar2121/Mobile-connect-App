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
    
    const fakeMemories = [
      { _id: 'm1', mediaUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', uploader: { _id: 'u2', fullName: 'Amma', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80' }, caption: 'Our trip to the mountains!', createdAt: new Date(Date.now() - 86400000).toISOString(), likes: ['u1', 'u3', 'u4'] },
      { _id: 'm2', mediaUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80', mediaType: 'image', uploader: { _id: 'u3', fullName: 'Appa', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' }, caption: 'Birthday party memories', createdAt: new Date(Date.now() - 172800000).toISOString(), likes: ['u1'] },
      { _id: 'm3', mediaUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', uploader: { _id: 'u1', fullName: 'Malaravan T.', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80' }, caption: 'New Year celebration', createdAt: new Date(Date.now() - 259200000).toISOString(), likes: ['u2', 'u3'] },
      { _id: 'm4', mediaUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', uploader: { _id: 'u4', fullName: 'Sister', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80' }, caption: 'Just hanging out', createdAt: new Date(Date.now() - 345600000).toISOString(), likes: [] }
    ];

    const fakeAlbums = [
      { _id: 'a1', title: 'Summer Vacation 2026', coverMemory: fakeMemories[0], memoryCount: 45, owner: { _id: 'u2', fullName: 'Amma', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80' } },
      { _id: 'a2', title: 'Birthdays', coverMemory: fakeMemories[1], memoryCount: 12, owner: { _id: 'u3', fullName: 'Appa', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' } }
    ];

    setMemories(fakeMemories);
    setAlbums(fakeAlbums);
    setViewCounts({});
    setLegacyProfiles([]);
    setLoading(false);
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
