import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { useTheme } from './useTheme';
import { getFamilyTree } from '../services/familyTreeService';
import { getFamilyEvents } from '../services/eventService';
import { getFamilyMemories } from '../services/memoryService';
import { getFamilyLocations } from '../services/locationService';
import { getNotifications } from '../services/notificationService';
import { getAllMessages } from '../services/chatService';
import { getJoinRequests } from '../services/familyService';
import {
  buildFamilyAnalytics,
  buildFamilyTimeline,
  loadFamilyMotto,
  mapTreeNodeToMember,
  resolveDisplayRole,
} from '../utils/familyModuleHelpers';
import { countLiveMembers } from '../utils/dashboardHelpers';

export function useFamilyModuleData() {
  const { user } = useAuth();
  const { uiMode } = useTheme();
  const { family, members, loading: familyLoading, refreshFamily } = useFamily();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [treeNodes, setTreeNodes] = useState([]);
  const [events, setEvents] = useState([]);
  const [memories, setMemories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [motto, setMotto] = useState('');
  const [joinRequests, setJoinRequests] = useState([]);

  const familyId = family?._id;

  const loadData = useCallback(async () => {
    if (!family) {
      setTreeNodes([]);
      setEvents([]);
      setMemories([]);
      setLocations([]);
      setNotifications([]);
      setMessages([]);
      setMotto('');
      setJoinRequests([]);
      setLoading(false);
      return;
    }

    setError('');
    try {
      const [tree, ev, mem, loc, notif, msgs, localMotto, reqs] = await Promise.all([
        getFamilyTree().catch(() => []),
        getFamilyEvents().catch(() => []),
        getFamilyMemories().catch(() => []),
        getFamilyLocations().catch(() => []),
        getNotifications().catch(() => []),
        getAllMessages().catch(() => []),
        loadFamilyMotto(family._id),
        getJoinRequests().catch(() => []),
      ]);
      setTreeNodes(tree);
      setEvents(ev);
      setMemories(mem);
      setLocations(loc);
      setNotifications(notif);
      setMessages(msgs);
      setMotto(localMotto);
      setJoinRequests(reqs?.requests || reqs || []);
    } catch (e) {
      setError(e.message || 'Could not load family data.');
    } finally {
      setLoading(false);
    }
  }, [family]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshFamily();
      await loadData();
    } catch (e) {
      setError(e.message || 'Could not refresh family.');
    } finally {
      setRefreshing(false);
    }
  }, [refreshFamily, loadData]);

  useFocusEffect(
    useCallback(() => {
      refreshFamily().finally(() => loadData());
    }, [refreshFamily, loadData]),
  );

  const locationByUser = useMemo(() => {
    const map = {};
    (locations ?? []).forEach((l) => {
      const uid = String(l.user?._id ?? l.user ?? l.userId ?? '');
      if (uid) map[uid] = l;
    });
    return map;
  }, [locations]);

  const enrichedMembers = useMemo(
    () =>
      (members ?? []).map((m) => {
        const tree = mapTreeNodeToMember(treeNodes, m._id);
        const node = treeNodes.find((n) => String(n.id) === String(m._id));
        const loc = locationByUser[String(m._id)];
        const displayRole = resolveDisplayRole(m, family);
        return {
          ...m,
          displayRole,
          relationshipLabel: tree?.relationshipLabel ?? 'Family member',
          relationshipType: tree?.relationshipType,
          nickname: tree?.nickname,
          relatedToName: tree?.relatedToName,
          joinedAt: tree?.joinedAt ?? m.createdAt,
          dateOfBirth: node?.dateOfBirth,
          treeName: node?.name,
          location: loc,
          hasLocation: Boolean(loc?.latitude ?? loc?.coordinates),
        };
      }),
    [members, treeNodes, locationByUser, family],
  );

  const onlineCount = useMemo(() => countLiveMembers(locations), [locations]);
  const timeline = useMemo(
    () => buildFamilyTimeline({ family, members, notifications, memories, uiMode }),
    [family, members, notifications, memories, uiMode],
  );
  const analytics = useMemo(
    () => buildFamilyAnalytics({ members, memories, events, messages, treeNodes }),
    [members, memories, events, messages, treeNodes],
  );

  const isAdmin = user?.role === 'admin';
  const isOwner =
    family?.createdBy &&
    String(family.createdBy._id ?? family.createdBy) === String(user?._id);

  return {
    user,
    family,
    familyId,
    members: enrichedMembers,
    treeNodes,
    events,
    memories,
    messages,
    notifications,
    locations,
    locationByUser,
    motto,
    setMotto,
    familyLoading,
    loading,
    refreshing,
    error,
    refresh,
    loadData,
    noFamily: !family,
    inviteCode: family?.inviteCode ?? '',
    memberCount: members.length,
    onlineCount,
    pendingJoinRequests: joinRequests.length,
    joinRequests,
    timeline,
    analytics,
    uiMode,
    isAdmin,
    isOwner,
    canManage: isAdmin && uiMode !== 'minor',
  };
}
