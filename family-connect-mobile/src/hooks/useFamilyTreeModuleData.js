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
    
    const fakeTreeNodes = [
      {
        id: 'u1',
        name: 'Malaravan T.',
        relationshipType: 'other',
        nickname: 'Self',
        relatedTo: null,
        dateOfBirth: '1998-05-15',
      },
      {
        id: 'u3',
        name: 'Appa',
        relationshipType: 'parent',
        nickname: 'Father',
        relatedTo: 'u1',
        dateOfBirth: '1968-11-20',
      },
      {
        id: 'u2',
        name: 'Amma',
        relationshipType: 'parent',
        nickname: 'Mother',
        relatedTo: 'u1',
        dateOfBirth: '1972-04-12',
      },
      {
        id: 'u2_spouse',
        name: 'Amma',
        relationshipType: 'spouse',
        nickname: 'Spouse',
        relatedTo: 'u3',
      },
      {
        id: 'u4',
        name: 'Sister',
        relationshipType: 'sibling',
        nickname: 'Sister',
        relatedTo: 'u1',
        dateOfBirth: '2002-08-30',
      },
      {
        id: 'g1',
        name: 'Grandpa Thatha',
        avatar: 'https://images.unsplash.com/photo-1472417589173-f770c97e59c4?auto=format&fit=crop&w=200&q=80',
        relationshipType: 'parent',
        nickname: 'Father',
        relatedTo: 'u3',
        dateOfBirth: '1942-01-10',
        dateOfDeath: '2021-06-15',
      },
      {
        id: 'g2',
        name: 'Grandma Paati',
        avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=200&q=80',
        relationshipType: 'parent',
        nickname: 'Mother',
        relatedTo: 'u3',
        dateOfBirth: '1947-09-18',
        dateOfDeath: '2024-03-02',
      },
      {
        id: 'g2_spouse',
        name: 'Grandma Paati',
        relationshipType: 'spouse',
        nickname: 'Spouse',
        relatedTo: 'g1',
      },
      {
        id: 'u5',
        name: 'Mamaji',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        relationshipType: 'sibling',
        nickname: 'Brother',
        relatedTo: 'u2',
        dateOfBirth: '1975-07-25',
      }
    ];

    const fakeLegacyProfiles = [
      {
        memberId: 'g1',
        displayName: 'Grandpa Thatha',
        years: '1942 – 2021',
        story: 'A visionary teacher who dedicated his life to education and family values. He loved gardening and chess.',
        photoUri: 'https://images.unsplash.com/photo-1472417589173-f770c97e59c4?auto=format&fit=crop&w=200&q=80',
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      },
      {
        memberId: 'g2',
        displayName: 'Grandma Paati',
        years: '1947 – 2024',
        story: 'The warm heart of the family, known for her delicious traditional recipes and endless stories.',
        photoUri: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=200&q=80',
        createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
      }
    ];

    const fakeHistory = {
      origins: 'Tracing back to South India, our family settled in Chennai in the early 1960s.',
      traditions: 'Every Pongal, the entire family gathers at the ancestral home for traditional cooking and games.',
      culturalNotes: 'Deeply rooted in agriculture and education.',
      importantEvents: '1965: Relocated to Chennai. 2002: Malaravan\'s sister born.',
      achievements: 'Multiple teachers, engineers, and community leaders.',
      historicalMemories: 'Preserved photos from 1950s showing agricultural life.',
    };

    setTreeNodes(fakeTreeNodes);
    setMemories([
      { _id: 'm1', caption: 'Family reunion', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), uploadedBy: { fullName: 'Amma' } },
      { _id: 'm2', caption: 'Festival cooking', createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), uploadedBy: { fullName: 'Appa' } }
    ]);
    setEvents([
      { _id: 'e1', title: 'Grandparents Anniversary', date: '2020-05-10', description: 'Celebrated 50 years together.' }
    ]);
    setLegacyProfiles(fakeLegacyProfiles);
    setAchievements([
      { id: 'a1', title: 'Generations Mapped', description: 'Linked 3 generations of the family tree', date: new Date().toISOString(), memberId: 'u1' },
      { id: 'a2', title: 'Legacy Keeper', description: 'Created 2 legacy remembrance profiles', date: new Date().toISOString(), memberId: 'u1' }
    ]);
    setFamilyHistory(fakeHistory);
    setTreeSettings({
      showGenerationLabels: true,
      showNicknames: true,
      animateConnections: true,
      highlightPath: true,
      defaultZoom: 1,
      elderLargeNodes: false,
    });
    setLoading(false);
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
