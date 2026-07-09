import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, PageHeader, Card } from '../../design-system';
import { CalendarHeader, CalendarGrid, CalendarLegend, EventCard } from '../../components/events';
import { useEventsModuleData } from '../../hooks/useEventsModuleData';
import { formatEventDateLong } from '../../utils/eventFormat';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function CalendarScreen() {
  const navigation = useNavigation();
  const { colors, layout } = useTheme();
  const { horizontalPadding } = useResponsive();
  const { eventsByDay, upcomingEvents, userId } = useEventsModuleData();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [viewMode, setViewMode] = useState('month');
  const [selectedDate, setSelectedDate] = useState(now);

  const selectedEvents = useMemo(() => {
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
    return eventsByDay[key] ?? [];
  }, [selectedDate, eventsByDay]);

  const weekEvents = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return upcomingEvents.filter((e) => {
      const d = new Date(e.date);
      return d >= start && d < end;
    });
  }, [selectedDate, upcomingEvents]);

  const goPrev = useCallback(() => {
    if (viewMode === 'month') {
      if (month === 0) {
        setMonth(11);
        setYear((y) => y - 1);
      } else setMonth((m) => m - 1);
    } else {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - (viewMode === 'week' ? 7 : 1));
      setSelectedDate(d);
      setMonth(d.getMonth());
      setYear(d.getFullYear());
    }
  }, [month, viewMode, selectedDate]);

  const goNext = useCallback(() => {
    if (viewMode === 'month') {
      if (month === 11) {
        setMonth(0);
        setYear((y) => y + 1);
      } else setMonth((m) => m + 1);
    } else {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + (viewMode === 'week' ? 7 : 1));
      setSelectedDate(d);
      setMonth(d.getMonth());
      setYear(d.getFullYear());
    }
  }, [month, viewMode, selectedDate]);

  const handleViewChange = useCallback((mode) => {
    if (mode === 'agenda') {
      navigation.navigate('Agenda');
      return;
    }
    setViewMode(mode);
  }, [navigation]);

  return (
    <Screen edges={['top']}>
      <PageHeader title="Calendar" subtitle="Month · Week · Day" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 32 }}>
        <CalendarHeader
          month={month}
          year={year}
          viewMode={viewMode}
          onPrev={goPrev}
          onNext={goNext}
          onViewChange={handleViewChange}
        />

        {viewMode === 'month' ? (
          <>
            <CalendarGrid
              month={month}
              year={year}
              selectedDate={selectedDate}
              eventsByDay={eventsByDay}
              onSelectDate={setSelectedDate}
              onEventPress={(e) => navigation.navigate('EventDetails', { id: String(e._id) })}
            />
            <CalendarLegend />
          </>
        ) : null}

        {viewMode === 'week' ? (
          <FlatList
            data={weekEvents}
            keyExtractor={(item) => String(item._id)}
            renderItem={({ item }) => (
              <EventCard event={item} userId={userId} onPress={(e) => navigation.navigate('EventDetails', { id: String(e._id) })} />
            )}
            scrollEnabled={false}
            ListEmptyComponent={<Text style={{ color: colors.textSecondary }}>No events this week.</Text>}
          />
        ) : null}

        {viewMode === 'day' ? (
          <>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', marginBottom: 12, fontSize: 16 * layout.fontScale }}>
              {formatEventDateLong(selectedDate)}
            </Text>
            {selectedEvents.length === 0 ? (
              <Card><Text style={{ color: colors.textSecondary }}>No events on this day.</Text></Card>
            ) : (
              selectedEvents.map((e) => (
                <EventCard key={e._id} event={e} userId={userId} onPress={() => navigation.navigate('EventDetails', { id: String(e._id) })} />
              ))
            )}
          </>
        ) : null}

        {viewMode === 'month' && selectedEvents.length > 0 ? (
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', marginBottom: 8 }}>Selected day</Text>
            {selectedEvents.map((e) => (
              <EventCard key={e._id} event={e} userId={userId} onPress={() => navigation.navigate('EventDetails', { id: String(e._id) })} compact />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
