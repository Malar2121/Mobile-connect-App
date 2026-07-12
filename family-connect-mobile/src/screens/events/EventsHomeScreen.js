import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FAB, PageHeader, Screen, SectionTitle } from '../../design-system';
import { useEventsModuleData } from '../../hooks/useEventsModuleData';
import {
  CountdownCard,
  EmptyEvents,
  EventCard,
  EventInsightsCard,
  EventsQuickActions,
  EventSkeleton,
  ReminderCard,
} from '../../components/events';
import { deriveReminders } from '../../utils/dashboardHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function EventsHomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, layout } = useTheme();
  const { horizontalPadding } = useResponsive();
  const {
    loading,
    refreshing,
    refresh,
    todayEvents,
    upcomingEvents,
    pastEvents,
    pendingRsvpEvents,
    insights,
    userId,
    isMinor,
    error,
  } = useEventsModuleData();

  const reminders = deriveReminders([...todayEvents, ...upcomingEvents]);

  const navigate = useCallback((screen, params) => navigation.navigate(screen, params), [navigation]);

  const renderUpcoming = useCallback(
    ({ item }) => (
      <EventCard event={item} userId={userId} onPress={(e) => navigate('EventDetails', { id: String(e._id) })} compact />
    ),
    [userId, navigate],
  );

  if (loading && !refreshing) {
    return (
      <Screen edges={['top']}>
        <PageHeader title="Events" subtitle="Your family calendar" large />
        <EventSkeleton />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} noPadding>
      <View style={{ paddingHorizontal: horizontalPadding }}>
        <PageHeader title="Events" subtitle="Smart family gatherings" large />
        {error ? <Text style={{ color: colors.error, marginBottom: 8 }}>{error}</Text> : null}
        {insights.nextCountdown ? (
          <CountdownCard label="Next event" value={insights.nextCountdown} style={{ marginBottom: 12 }} />
        ) : null}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        <EventsQuickActions onNavigate={navigate} isMinor={isMinor} />
        <EventInsightsCard insights={insights} />

        <SectionTitle title="Today's events" subtitle={`${todayEvents.length} scheduled`} />
        {todayEvents.length === 0 ? (
          <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>Nothing on the calendar today.</Text>
        ) : (
          todayEvents.map((e) => (
            <EventCard key={e._id} event={e} userId={userId} onPress={() => navigate('EventDetails', { id: String(e._id) })} />
          ))
        )}

        <SectionTitle title="Reminders" subtitle="Upcoming family moments" style={{ marginTop: 8 }} />
        {reminders.slice(0, 3).map((r) => (
          <ReminderCard
            key={r.id}
            reminder={{ ...r, icon: 'alarm-outline' }}
            onPress={() => navigate('EventDetails', { id: r.id })}
          />
        ))}

        <SectionTitle title="Pending RSVPs" subtitle={`${pendingRsvpEvents.length} need your reply`} style={{ marginTop: 8 }} />
        {pendingRsvpEvents.length === 0 ? (
          <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>You're all caught up.</Text>
        ) : (
          pendingRsvpEvents.slice(0, 3).map((e) => (
            <EventCard key={e._id} event={e} userId={userId} onPress={() => navigate('EventDetails', { id: String(e._id) })} />
          ))
        )}

        <SectionTitle title="Upcoming" subtitle="Next on your calendar" style={{ marginTop: 8 }} />
        {upcomingEvents.length === 0 ? (
          <EmptyEvents onCreate={() => navigate('CreateEvent')} isMinor={isMinor} />
        ) : (
          <FlatList
            data={upcomingEvents.slice(0, 8)}
            keyExtractor={(item) => String(item._id)}
            renderItem={renderUpcoming}
            scrollEnabled={false}
            initialNumToRender={6}
          />
        )}

        {pastEvents.length > 0 ? (
          <>
            <SectionTitle title="Recently completed" style={{ marginTop: 8 }} />
            {pastEvents.slice(0, 2).map((e) => (
              <EventCard key={e._id} event={e} userId={userId} onPress={() => navigate('EventDetails', { id: String(e._id) })} compact />
            ))}
            <Text
              onPress={() => navigate('EventHistory')}
              style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', marginTop: 8 }}
            >
              View full history →
            </Text>
          </>
        ) : null}
      </ScrollView>

      {!isMinor ? (
        <FAB
          onPress={() => navigate('CreateEvent')}
          bottom={20 + insets.bottom + 52}
          icon={<Ionicons name="add" size={28} color="#fff" />}
          accessibilityLabel="Create event"
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({});
