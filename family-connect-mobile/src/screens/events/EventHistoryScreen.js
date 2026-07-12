import React, { useCallback } from 'react';
import { Pressable, FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PageHeader, Screen, Card } from '../../design-system';
import { EventTimeline } from '../../components/events';
import { useEventsModuleData } from '../../hooks/useEventsModuleData';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function EventHistoryScreen() {
  const navigation = useNavigation();
  const { colors, layout } = useTheme();
  const { horizontalPadding } = useResponsive();
  const { history, insights, refreshing, refresh } = useEventsModuleData();

  const timelineItems = history.map((h) => ({
    id: h.id,
    title: h.event.title,
    subtitle: h.event.location || new Date(h.event.date).toLocaleDateString(),
    meta: `${h.attendance}/${h.totalGuests} attended · ${h.memoriesCount} memories`,
  }));

  const renderItem = useCallback(
    ({ item }) => (
      <Pressable onPress={() => navigation.navigate('EventDetails', { id: item.id })}>
        <Card style={{ marginBottom: 10 }}>
          <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 16 * layout.fontScale }}>{item.event.title}</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
            {item.attendance} attended · {item.memoriesCount} linked memories
          </Text>
        </Card>
      </Pressable>
    ),
    [colors, layout, navigation],
  );

  return (
    <Screen edges={['top']}>
      <PageHeader title="Event history" subtitle="Completed gatherings" onBack={() => navigation.goBack()} />
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 32 }}
        onRefresh={refresh}
        refreshing={refreshing}
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <Card>
              <Text style={{ color: colors.textSecondary }}>Attendance rate</Text>
              <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 28 * layout.fontScale }}>{insights.avgRsvp}%</Text>
              <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 4 }}>Average RSVP across all events</Text>
            </Card>
            <EventTimeline items={timelineItems} title="Timeline" />
          </View>
        }
        ListEmptyComponent={<Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No completed events yet.</Text>}
        initialNumToRender={8}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({});
