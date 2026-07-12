import React, { useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Badge,
  Card,
  EmptyState,
  FAB,
  PageHeader,
  Screen,
  Skeleton,
} from '../../design-system';
import { NotificationItem } from '../../components/NotificationItem';
import { useTheme } from '../../hooks/useTheme';
import { getNotifications, markNotificationRead } from '../../services/notificationService';
import {
  countUnread,
  filterNotificationsForMode,
  getNavigationTarget,
} from '../../utils/notificationHelpers';

export default function NotificationsScreen({ navigation }) {
  const { colors, layout, uiMode } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const firstFocus = useRef(true);

  const visible = filterNotificationsForMode(notifications, uiMode);
  const unreadCount = countUnread(visible);

  const load = useCallback(async () => {
    setError('');
    try {
      const list = await getNotifications();
      setNotifications(list);
    } catch (e) {
      setError(e.message || 'Could not load notifications.');
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        setLoading(true);
        firstFocus.current = false;
      }
      load();
    }, [load]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const navigateToTarget = useCallback(
    (notification) => {
      if (uiMode === 'minor' && notification.type === 'chat_message') return;

      const target = getNavigationTarget(notification);
      const root = navigation.getParent();

      if (target.screen && target.params) {
        root?.navigate(target.tab, { screen: target.screen, params: target.params });
      } else if (target.screen) {
        root?.navigate(target.tab, { screen: target.screen });
      } else if (target.tab) {
        root?.navigate(target.tab);
      }
    },
    [navigation, uiMode],
  );

  const handlePress = useCallback(
    async (notification) => {
      if (!notification.isRead) {
        try {
          await markNotificationRead(notification._id);
          setNotifications((prev) =>
            prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n)),
          );
        } catch {
          /* still navigate */
        }
      }
      navigateToTarget(notification);
    },
    [navigateToTarget],
  );

  if (loading && !refreshing) {
    return (
      <Screen edges={['top']}>
        <PageHeader title="Notifications" onBack={() => navigation.goBack()} />
        <Skeleton variant="list-row" count={5} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} noPadding>
      <View style={{ paddingHorizontal: layout.contentPadding }}>
        <PageHeader
          title="Notifications"
          subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          onBack={() => navigation.goBack()}
          large
        />
        {unreadCount > 0 ? (
          <Badge label={`${unreadCount} new`} variant="primary" style={{ marginBottom: 12 }} />
        ) : null}
        {error ? (
          <Text style={{ color: colors.error, marginBottom: 8, fontSize: 14 * layout.fontScale }}>
            {error}
          </Text>
        ) : null}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => String(item._id)}
        contentContainerStyle={{
          paddingHorizontal: layout.contentPadding,
          paddingBottom: layout.sectionGap * 2,
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
            icon="notifications-off-outline"
            title="No notifications"
            description="When your family shares events, memories, or messages, you'll see them here."
            compact
          />
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 10, padding: 0 }} padded={false}>
            <NotificationItem notification={item} onPress={() => handlePress(item)} />
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({});
