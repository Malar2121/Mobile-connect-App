import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { useTheme } from './useTheme';
import { getFamilyEvents } from '../services/eventService';
import { getFamilyMemories } from '../services/memoryService';
import { getFamilyLocations } from '../services/locationService';
import { getNotifications } from '../services/notificationService';
import { getAllMessages } from '../services/chatService';
import {
  pickUpcomingEvents,
  countLiveMembers,
  countUnreadNotifications,
  countUnreadMessages,
  countMemoriesSince,
  startOfToday,
  deriveReminders,
  buildActivityFeed,
  deriveInsights,
  deriveWeeklyActivity,
} from '../utils/dashboardHelpers';

const EMPTY_STATS = {
  events: 0,
  memories: 0,
  photos: 0,
  locations: 0,
};

export function useDashboardData() {
  const { user } = useAuth();
  const { uiMode } = useTheme();
  const { family, members, loading: familyLoading, refreshFamily } = useFamily();

  const [refreshing, setRefreshing] = useState(false);
  const [sectionLoading, setSectionLoading] = useState(true);
  const [sectionError, setSectionError] = useState('');
  const [events, setEvents] = useState([]);
  const [memories, setMemories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);

  const loadSections = useCallback(async (hasFamily) => {
    if (!hasFamily) {
      setEvents([]);
      setMemories([]);
      setLocations([]);
      setNotifications([]);
      setMessages([]);
      setSectionLoading(false);
      return;
    }

    setSectionError('');

    try {
      const [ev, mem, loc, notif, msgs] = await Promise.all([
        getFamilyEvents(),
        getFamilyMemories(),
        getFamilyLocations().catch(() => []),
        getNotifications().catch(() => []),
        getAllMessages().catch(() => []),
      ]);

      setEvents(ev);
      setMemories(mem);
      setLocations(loc);
      setNotifications(notif);
      setMessages(msgs);
    } catch (e) {
      setSectionError(e.message || 'Could not refresh dashboard.');
    } finally {
      setSectionLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await refreshFamily();
      await loadSections(!!data?.family);
    } catch (e) {
      setSectionError(e.message || 'Could not load dashboard.');
    } finally {
      setRefreshing(false);
    }
  }, [refreshFamily, loadSections]);

  useFocusEffect(
    useCallback(() => {
      refreshFamily()
        .then((data) => loadSections(!!data?.family))
        .catch(() => loadSections(false));
    }, [refreshFamily, loadSections]),
  );

  const liveCount = useMemo(() => countLiveMembers(locations), [locations]);
  const today = useMemo(() => startOfToday(), []);

  const upcomingEvents = useMemo(() => pickUpcomingEvents(events, 5), [events]);
  const recentMemories = useMemo(() => memories.slice(0, 10), [memories]);
  const reminders = useMemo(() => deriveReminders(events), [events]);
  const activityFeed = useMemo(
    () => buildActivityFeed(notifications, memories, members, uiMode),
    [notifications, memories, members, uiMode],
  );
  const insights = useMemo(
    () => deriveInsights(events, memories, messages, members, user?._id),
    [events, memories, messages, members, user?._id],
  );
  const weeklyActivity = useMemo(
    () => deriveWeeklyActivity(events, memories, messages),
    [events, memories, messages],
  );

  const todaySummary = useMemo(() => {
    const todayEvents = events.filter(
      (e) => e.date && new Date(e.date) >= today && new Date(e.date) < new Date(today.getTime() + 86400000),
    ).length;

    return {
      todayEvents,
      newMemories: countMemoriesSince(memories, today),
      unreadMessages: countUnreadMessages(messages, user?._id),
      unreadNotifications: countUnreadNotifications(notifications, uiMode),
      activeMembers: liveCount,
    };
  }, [events, memories, messages, notifications, liveCount, today, user?._id, uiMode]);

  const stats = useMemo(
    () => ({
      events: events.length,
      memories: memories.length,
      photos: memories.filter((m) => m.mediaType === 'image').length,
      locations: locations.length,
    }),
    [events, memories, locations],
  );

  const noFamily = !familyLoading && !family;

  return {
    family,
    members: members ?? [],
    familyLoading,
    sectionLoading,
    refreshing,
    sectionError,
    refresh,
    user,
    uiMode,
    noFamily,
    familyName: family?.name ?? '',
    inviteCode: family?.inviteCode ?? '',
    memberCount: members?.length ?? 0,
    liveCount,
    upcomingEvents,
    recentMemories,
    reminders,
    activityFeed,
    insights,
    weeklyActivity,
    todaySummary,
    stats: family ? stats : EMPTY_STATS,
    unreadNotificationCount: todaySummary.unreadNotifications,
  };
}
