import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { useTheme } from './useTheme';
import { getFamilyTree } from '../services/familyTreeService';
import { getFamilyMemories } from '../services/memoryService';
import { getFamilyEvents } from '../services/eventService';
import { loadLegacyProfiles } from '../utils/memoryModuleHelpers';
import {
  buildHeritageTimeline,
  buildTreeAnalytics,
  enrichTreeNodes,
  getAncestors,
  getDescendants,
  getFamilyMilestones,
  getPersonRelations,
  layoutTree,
  loadAchievements,
  loadFamilyHistory,
  loadTreeSettings,
  searchTree,
} from '../utils/familyTreeModuleHelpers';

export function useFamilyTreeModuleData(searchFilters = {}) {
  const { user } = useAuth();
  const { members, family } = useFamily();
  const { uiMode } = useTheme();

  const [treeNodes, setTreeNodes] = useState([]);
  const [memories, setMemories] = useState([]);
  const [events, setEvents] = useState([]);
  const [legacyProfiles, setLegacyProfiles] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [familyHistory, setFamilyHistory] = useState(null);
  const [treeSettings, setTreeSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!family) {
      setTreeNodes([]);
      setLoading(false);
      return;
    }
    setError('');
    try {
      const familyId = family._id;
      const [nodes, mem, ev, legacy, ach, history, settings] = await Promise.all([
        getFamilyTree().catch(() => []),
        getFamilyMemories().catch(() => []),
        getFamilyEvents().catch(() => []),
        loadLegacyProfiles(familyId),
        loadAchievements(familyId),
        loadFamilyHistory(familyId),
        loadTreeSettings(familyId),
      ]);
      setTreeNodes(nodes);
      setMemories(mem);
      setEvents(ev);
      setLegacyProfiles(legacy);
      setAchievements(ach);
      setFamilyHistory(history);
      setTreeSettings(settings);
    } catch (e) {
      setError(e.message || 'Could not load family tree.');
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
      setLoading((prev) => (treeNodes.length ? prev : true));
      load();
    }, [load, treeNodes.length]),
  );

  const enrichedNodes = useMemo(() => enrichTreeNodes(treeNodes, members), [treeNodes, members]);
  const analytics = useMemo(
    () => buildTreeAnalytics(enrichedNodes, legacyProfiles),
    [enrichedNodes, legacyProfiles],
  );
  const heritageTimeline = useMemo(
    () => buildHeritageTimeline({ nodes: enrichedNodes, events, memories, legacyProfiles, achievements }),
    [enrichedNodes, events, memories, legacyProfiles, achievements],
  );
  const milestones = useMemo(
    () => getFamilyMilestones({ nodes: enrichedNodes, events, legacyProfiles }),
    [enrichedNodes, events, legacyProfiles],
  );
  const searchResults = useMemo(
    () => searchTree(enrichedNodes, searchFilters),
    [enrichedNodes, searchFilters],
  );
  const treeLayout = useMemo(() => layoutTree(enrichedNodes), [enrichedNodes]);

  const canManage =
    user?.role === 'admin' || members?.find((m) => String(m._id) === String(user?._id))?.role === 'admin';

  return {
    user,
    family,
    members,
    treeNodes,
    enrichedNodes,
    memories,
    events,
    legacyProfiles,
    achievements,
    familyHistory,
    setFamilyHistory,
    treeSettings,
    setTreeSettings,
    analytics,
    heritageTimeline,
    milestones,
    searchResults,
    treeLayout,
    loading,
    refreshing,
    refresh,
    error,
    canManage,
    isMinor: uiMode === 'minor',
    isElder: uiMode === 'elder',
    getAncestors: useCallback((id, depth) => getAncestors(id, enrichedNodes, depth), [enrichedNodes]),
    getDescendants: useCallback((id, depth) => getDescendants(id, enrichedNodes, depth), [enrichedNodes]),
    getPersonRelations: useCallback((id) => getPersonRelations(id, enrichedNodes), [enrichedNodes]),
  };
}
