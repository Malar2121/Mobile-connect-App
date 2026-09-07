import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Screen,
  useDialog,
  useToast,
} from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';
import { approveConsent, getPendingConsents, rejectConsent } from '../../services/consentService';

/**
 * Guardian review queue for minors' accounts.
 * Only family admins and parents can reach a result here — the server rejects
 * everyone else, and this screen surfaces that rather than hiding it.
 */
export default function ChildApprovalsScreen() {
  const navigation = useNavigation();
  const { colors, layout } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const dialog = useDialog();

  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      setPending(await getPendingConsents());
    } catch (e) {
      setError(e.message || t('consent.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const decide = useCallback(
    async (item, approve) => {
      const ok = await dialog.confirm({
        title: approve ? t('consent.approveTitle') : t('consent.rejectTitle'),
        message: approve
          ? t('consent.approveMessage', { name: item.child?.fullName ?? '' })
          : t('consent.rejectMessage', { name: item.child?.fullName ?? '' }),
        confirmLabel: approve ? t('consent.approve') : t('consent.reject'),
        destructive: !approve,
      });
      if (!ok) return;

      setBusyId(item._id);
      try {
        if (approve) await approveConsent(item._id);
        else await rejectConsent(item._id);
        toast.success(approve ? t('consent.approved') : t('consent.rejected'));
        await load();
      } catch (e) {
        toast.error(e.message || t('consent.decisionFailed'));
      } finally {
        setBusyId(null);
      }
    },
    [dialog, toast, load, t],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <Card style={{ marginBottom: 12 }}>
        <View style={styles.row}>
          <Avatar uri={item.child?.avatar} name={item.child?.fullName} size={layout.avatarSize} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 15 * layout.fontScale }}
              numberOfLines={1}
            >
              {item.child?.fullName}
            </Text>
            <Text
              style={{ color: colors.textSecondary, fontSize: 12.5 * layout.fontScale, marginTop: 2 }}
              numberOfLines={1}
            >
              {item.child?.email}
            </Text>
          </View>
        </View>

        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 13 * layout.fontScale,
            marginTop: 12,
            lineHeight: 20,
          }}
        >
          {t('consent.explain')}
        </Text>

        <View style={styles.actions}>
          <Button
            title={t('consent.approve')}
            onPress={() => decide(item, true)}
            loading={busyId === item._id}
            style={{ flex: 1 }}
          />
          <Button
            title={t('consent.reject')}
            variant="secondary"
            onPress={() => decide(item, false)}
            disabled={busyId === item._id}
            style={{ flex: 1 }}
          />
        </View>
      </Card>
    ),
    [colors, layout, busyId, decide, t],
  );

  return (
    <Screen edges={['top']}>
      <PageHeader
        title={t('consent.queueTitle')}
        subtitle={t('consent.queueSubtitle')}
        onBack={() => navigation.goBack()}
      />

      {error ? (
        <Card style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.error, fontSize: 14 * layout.fontScale }}>{error}</Text>
          <Button title={t('common.retry')} variant="secondary" onPress={load} style={{ marginTop: 10 }} />
        </Card>
      ) : null}

      <FlatList
        data={pending}
        keyExtractor={(item) => String(item._id)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={
          loading ? (
            <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale }}>
              {t('common.loading')}
            </Text>
          ) : error ? null : (
            <EmptyState
              icon="shield-checkmark-outline"
              title={t('consent.emptyTitle')}
              description={t('consent.emptyBody')}
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
});
