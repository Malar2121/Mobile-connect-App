import React, { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  Badge,
  Card,
  EmptyState,
  FAB,
  PageHeader,
  Screen,
  Skeleton,
} from '../../design-system';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { useTheme } from '../../hooks/useTheme';
import { getFamilyEvents } from '../../services/eventService';
import {
  formatEventDateShort,
  getMyRsvpStatus,
  resolveEventCreatorName,
} from '../../utils/eventFormat';

const RSVP_VARIANT = {
  accepted: 'success',
  maybe: 'warning',
  declined: 'danger',
  pending: 'default',
};

const RSVP_LABEL = {
  accepted: 'Going',
  maybe: 'Maybe',
  declined: "Can't go",
  pending: 'No reply',
};

export default function EventsListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, layout, uiMode } = useTheme();
  const { user } = useAuth();
  const { members } = useFamily();
  const userId = user?._id;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const firstListFocus = useRef(true);

  const isMinor = uiMode === 'minor';
  const fabBottom = 20 + insets.bottom + 52;

  const load = useCallback(async () => {
    setError('');
    try {
      const list = await getFamilyEvents();
      setEvents(list);
    } catch (e) {
      setError(e.message || 'Could not load events.');
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (firstListFocus.current) {
        setLoading(true);
        firstListFocus.current = false;
      }
      load();
    }, [load]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  if (loading && !refreshing) {
    return (
      <Screen edges={['top']}>
        <PageHeader title="Events" subtitle="Loading…" large />
        <Skeleton variant="list-row" count={4} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} style={{ paddingHorizontal: 0 }}>
      <View style={{ paddingHorizontal: layout.contentPadding }}>
        <PageHeader title="Events" subtitle={`${events.length} scheduled`} large />
        {error ? (
          <Text style={{ color: colors.error, marginBottom: 8, fontSize: 14 * layout.fontScale }}>
            {error}
          </Text>
        ) : null}
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => String(item._id)}
        contentContainerStyle={{
          paddingHorizontal: layout.contentPadding,
          paddingTop: 4,
          paddingBottom: isMinor ? layout.sectionGap * 2 : fabBottom + 56,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="No events yet"
            description={
              isMinor
                ? 'Family events will appear here.'
                : 'Plan a gathering — tap + to create your first event.'
            }
            actionLabel={isMinor ? undefined : 'Create event'}
            onAction={isMinor ? undefined : () => navigation.navigate('CreateEvent')}
            compact
          />
        }
        renderItem={({ item }) => {
          const rsvp = getMyRsvpStatus(item, userId);
          const creator = resolveEventCreatorName(item, members);
          const dateLine = formatEventDateShort(item.date);
          const timeSuffix = item.startTime ? ` · ${item.startTime}` : '';

          return (
            <Pressable
              onPress={() => navigation.navigate('EventDetails', { id: String(item._id) })}
              accessibilityRole="button"
            >
              <Card
                style={[
                  styles.eventCard,
                  { marginBottom: 12, borderLeftWidth: 3, borderLeftColor: colors.primary },
                ]}
              >
                <View style={styles.cardTop}>
                  <Text
                    style={{
                      color: colors.text,
                      fontFamily: 'Inter_700Bold',
                      fontWeight: '700',
                      fontSize: 17 * layout.fontScale,
                      flex: 1,
                      paddingRight: 8,
                    }}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <Badge
                    label={RSVP_LABEL[rsvp] ?? RSVP_LABEL.pending}
                    variant={RSVP_VARIANT[rsvp] ?? 'default'}
                  />
                </View>
                <Text style={{ color: colors.textSecondary, marginTop: 10, fontSize: 14 * layout.fontScale }}>
                  {dateLine}
                  {timeSuffix}
                </Text>
                <Text style={{ color: colors.textTertiary, marginTop: 4, fontSize: 13 * layout.fontScale }}>
                  {creator}
                </Text>
              </Card>
            </Pressable>
          );
        }}
      />

      {!isMinor ? (
        <FAB
          onPress={() => navigation.navigate('CreateEvent')}
          accessibilityLabel="Create event"
          bottom={fabBottom}
          icon={<Ionicons name="add" size={28} color="#fff" />}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  eventCard: {},
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
});
