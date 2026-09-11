import React, { useCallback } from 'react';
import { Pressable, FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PageHeader, Screen, Card } from '../../design-system';
import { EventTimeline } from '../../components/events';
import { useEventsModuleData } from '../../hooks/useEventsModuleData';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';
import { useI18n } from '../../i18n';

export default function EventHistoryScreen() {
  const navigation = useNavigation();
  const { colors, layout } = useTheme();

  const { t } = useI18n();
  const { horizontalPadding } = useResponsive();
  const { history, insights, refreshing, refresh } = useEventsModuleData();

  const timelineItems = history.map((h) => ({
    id: h.id,
    title: h.event.title,
    subtitle: h.event.location || new Date(h.event.date).toLocaleDateString(),
    meta: t('events.historyMeta', { attended: h.attendance, total: h.totalGuests, memories: h.memoriesCount }),
  }));

  const renderItem = useCallback(
    ({ item }) => (
      <Pressable onPress={() => navigation.navigate('EventDetails', { id: item.id })}>
        <Card style={{ marginBottom: 10 }}>
          <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 16 * layout.fontScale }}>{item.event.title}</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
            {t('events.historyStats', { attended: item.attendance, memories: item.memoriesCount })}
          </Text>
        </Card>
      </Pressable>
    ),
    [colors, layout, navigation],
  );

  return (
    <Screen edges={['top']}>
      <PageHeader title={t('events.history')} subtitle={t('events.completedGatherings')} onBack={() => navigation.goBack()} />
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
              <Text style={{ color: colors.textSecondary }}>{t('events.attendanceRate')}</Text>
              <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 28 * layout.fontScale }}>{insights.avgRsvp}%</Text>
              <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 4 }}>{t('events.attendanceHint')}</Text>
            </Card>
            <EventTimeline items={timelineItems} title={t('memories.timeline')} />
          </View>
        }
        ListEmptyComponent={<Text style={{ color: colors.textSecondary, textAlign: 'center' }}>{t('events.noCompleted')}</Text>}
        initialNumToRender={8}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({});
