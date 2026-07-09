import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, PageHeader, Chip } from '../../design-system';
import { EventCard, EventSearchBar } from '../../components/events';
import { useEventsModuleData } from '../../hooks/useEventsModuleData';
import { EVENT_CATEGORIES } from '../../utils/eventModuleHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'today', label: 'Today' },
  { id: 'past', label: 'Past' },
  { id: 'pending_rsvp', label: 'Pending RSVP' },
];

export default function AgendaScreen() {
  const navigation = useNavigation();
  const { colors, layout } = useTheme();
  const { horizontalPadding } = useResponsive();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  const { agendaGroups, userId, refreshing, refresh, loading } = useEventsModuleData({
    query,
    category,
    status,
  });

  const renderGroup = useCallback(
    ({ item }) => (
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 16 * layout.fontScale, marginBottom: 10 }}>
          {item.date}
        </Text>
        {item.items.map((e) => (
          <EventCard
            key={e._id}
            event={e}
            userId={userId}
            onPress={() => navigation.navigate('EventDetails', { id: String(e._id) })}
          />
        ))}
      </View>
    ),
    [colors, layout, userId, navigation],
  );

  return (
    <Screen edges={['top']}>
      <PageHeader title="Agenda" subtitle="Grouped by date" onBack={() => navigation.goBack()} />
      <View style={{ paddingHorizontal: horizontalPadding, marginBottom: 12 }}>
        <EventSearchBar value={query} onChangeText={setQuery} />
        <View style={styles.chips}>
          {STATUS_FILTERS.map((f) => (
            <Chip key={f.id} label={f.label} selected={status === f.id} onPress={() => setStatus(f.id)} />
          ))}
        </View>
        <View style={[styles.chips, { marginTop: 8 }]}>
          <Chip label="All categories" selected={category === 'all'} onPress={() => setCategory('all')} />
          {EVENT_CATEGORIES.map((c) => (
            <Chip key={c.id} label={c.label} selected={category === c.id} onPress={() => setCategory(c.id)} />
          ))}
        </View>
      </View>

      <FlatList
        data={agendaGroups}
        keyExtractor={(item) => item.date}
        renderItem={renderGroup}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={
          !loading ? <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24 }}>No events match your filters.</Text> : null
        }
        initialNumToRender={5}
        maxToRenderPerBatch={8}
        windowSize={7}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
});
