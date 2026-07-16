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
    
    const fakeEvents = [
      {
        _id: 'e1',
        title: "Sister's Graduation",
        description: "Graduation ceremony at the university main hall. Let's all be there to support her!",
        date: new Date(Date.now() + 86400000).toISOString(),
        location: 'University Hall',
        image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        creator: { _id: 'u3', fullName: 'Appa' },
        guests: [
          { user: { _id: 'u1', fullName: 'Malaravan T.' }, status: 'attending' },
          { user: { _id: 'u2', fullName: 'Amma' }, status: 'attending' },
          { user: { _id: 'u4', fullName: 'Sister' }, status: 'attending' },
        ],
        poll: {
          _id: 'p1',
          options: [
            { _id: 'o1', date: new Date(Date.now() + 86400000).toISOString(), votes: [{ user: 'u1', value: 'yes' }, { user: 'u2', value: 'yes' }] },
            { _id: 'o2', date: new Date(Date.now() + 172800000).toISOString(), votes: [{ user: 'u1', value: 'no' }, { user: 'u2', value: 'maybe' }] }
          ]
        }
      }
    ];

    const fakeMemories = [
      { _id: 'm1', url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image' }
    ];

    setEvents(fakeEvents);
    setMemories(fakeMemories);
    setLoading(false);
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
