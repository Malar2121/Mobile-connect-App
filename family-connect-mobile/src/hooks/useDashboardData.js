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

  return {
    family: { _id: 'mock_family', name: 'The Malaravans', inviteCode: 'MLRV2026' },
    members: [
      { _id: 'u1', fullName: 'Malaravan T.', role: 'admin', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80' },
      { _id: 'u2', fullName: 'Amma', role: 'member', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80' },
      { _id: 'u3', fullName: 'Appa', role: 'member', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
      { _id: 'u4', fullName: 'Sister', role: 'member', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80' }
    ],
    familyLoading: false,
    sectionLoading: false,
    refreshing: false,
    sectionError: '',
    refresh: async () => {},
    user: { _id: 'u1', fullName: 'Malaravan T.', role: 'admin', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80' },
    uiMode: 'standard',
    noFamily: false,
    familyName: 'The Malaravans',
    inviteCode: 'MLRV2026',
    memberCount: 4,
    liveCount: 3,
    upcomingEvents: [
      { _id: 'e1', title: "Sister's Graduation", date: new Date(Date.now() + 86400000).toISOString(), location: 'University Hall' },
      { _id: 'e2', title: "Family Dinner", date: new Date(Date.now() + 172800000).toISOString(), location: 'Home' }
    ],
    recentMemories: [
      { _id: 'm1', mediaUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', caption: 'Summer trip!', uploader: { _id: 'u2', fullName: 'Amma', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80' }, createdAt: new Date(Date.now() - 86400000).toISOString() },
      { _id: 'm2', mediaUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80', mediaType: 'image', caption: 'Birthday party', uploader: { _id: 'u3', fullName: 'Appa', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' }, createdAt: new Date(Date.now() - 172800000).toISOString() },
      { _id: 'm3', mediaUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', caption: 'New Year', uploader: { _id: 'u1', fullName: 'Malaravan T.', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80' }, createdAt: new Date(Date.now() - 259200000).toISOString() }
    ],
    reminders: [
      { _id: 'r1', title: 'RSVP for Family Dinner', type: 'rsvp', date: new Date(Date.now() + 172800000).toISOString() }
    ],
    activityFeed: [
      { id: 'a1', title: 'Amma added 3 new photos', time: '2 hours ago', icon: 'images' },
      { id: 'a2', title: 'Appa arrived at Safe Zone: Home', time: '4 hours ago', icon: 'location' }
    ],
    insights: {
      mostActiveMember: 'Appa',
      mostActiveAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      eventsThisMonth: 4,
      memoriesThisMonth: 12,
      totalMemories: 142,
      messagesThisWeek: 87,
      participationPct: 95
    },
    weeklyActivity: [
      { key: 'Sun', label: 'S', count: 12, pct: 0.3, isToday: false },
      { key: 'Mon', label: 'M', count: 25, pct: 0.6, isToday: false },
      { key: 'Tue', label: 'T', count: 42, pct: 1.0, isToday: false },
      { key: 'Wed', label: 'W', count: 18, pct: 0.4, isToday: false },
      { key: 'Thu', label: 'T', count: 30, pct: 0.7, isToday: false },
      { key: 'Fri', label: 'F', count: 15, pct: 0.35, isToday: false },
      { key: 'Sat', label: 'S', count: 35, pct: 0.8, isToday: true },
    ],
    todaySummary: {
      todayEvents: 0,
      newMemories: 3,
      unreadMessages: 5,
      unreadNotifications: 2,
      activeMembers: 3,
    },
    stats: {
      events: 5,
      memories: 42,
      photos: 40,
      locations: 4,
    },
    unreadNotificationCount: 2,
  };
}
