import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { useTheme } from './useTheme';
import { getFamilyEvents } from '../services/eventService';
import { getFamilyMemories } from '../services/memoryService';
import {
  buildEventHistory,
  buildEventInsights,
  buildEventsByDayMap,
  filterPastEvents,
  filterPendingRsvpEvents,
  filterTodayEvents,
  filterUpcomingEvents,
  groupEventsByDate,
  searchAndFilterEvents,
} from '../utils/eventModuleHelpers';

export function useEventsModuleData(filters = {}) {
  const { user } = useAuth();
  const { members, family } = useFamily();
  const { uiMode } = useTheme();

  const [events, setEvents] = useState([]);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!family) {
      setEvents([]);
      setMemories([]);
      setLoading(false);
      return;
    }
    setError('');
    try {
      const [ev, mem] = await Promise.all([
        getFamilyEvents(),
        getFamilyMemories().catch(() => []),
      ]);
      setEvents(ev);
      setMemories(mem);
    } catch (e) {
      setError(e.message || 'Could not load events.');
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
      setLoading((prev) => (events.length ? prev : true));
      load();
    }, [load, events.length]),
  );

  const userId = user?._id;
  const todayEvents = useMemo(() => filterTodayEvents(events), [events]);
  const upcomingEvents = useMemo(() => filterUpcomingEvents(events), [events]);
  const pastEvents = useMemo(() => filterPastEvents(events), [events]);
  const pendingRsvpEvents = useMemo(
    () => filterPendingRsvpEvents(events, userId),
    [events, userId],
  );
  const filteredEvents = useMemo(
    () => searchAndFilterEvents(events, { ...filters, userId }),
    [events, filters, userId],
  );
  const agendaGroups = useMemo(() => groupEventsByDate(filteredEvents), [filteredEvents]);
  const eventsByDay = useMemo(() => buildEventsByDayMap(events), [events]);
  const insights = useMemo(
    () => buildEventInsights(events, members, userId),
    [events, members, userId],
  );
  const history = useMemo(
    () => buildEventHistory(events, memories),
    [events, memories],
  );

  const isMinor = uiMode === 'minor';

  return {
    events,
    memories,
    members,
    family,
    user,
    userId,
    loading,
    refreshing,
    error,
    refresh,
    load,
    todayEvents,
    upcomingEvents,
    pastEvents,
    pendingRsvpEvents,
    filteredEvents,
    agendaGroups,
    eventsByDay,
    insights,
    history,
    isMinor,
    noFamily: !family,
  };
}
