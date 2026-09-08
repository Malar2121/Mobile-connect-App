import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  Screen,
  SectionTitle,
  TextField,
  useDialog,
  useToast,
} from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';
import {
  createEmailInvitation,
  listInvitations,
  revokeInvitation,
} from '../../services/invitationService';

const STATUS_TONE = {
  pending: 'primary',
  accepted: 'success',
  expired: 'textTertiary',
  revoked: 'error',
};

export default function EmailInviteScreen() {
  const navigation = useNavigation();
  const { colors, layout, radii } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const dialog = useDialog();

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoadError('');
    try {
      setInvitations(await listInvitations());
    } catch (e) {
      setLoadError(e.message || t('invite.loadFailed'));
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

  const handleSend = useCallback(async () => {
    const trimmed = email.trim();
    setFormError('');
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setFormError(t('invite.emailInvalid'));
      return;
    }

    setSending(true);
    try {
      const result = await createEmailInvitation(trimmed);

      if (result.emailSent) {
        toast.success(t('invite.sent', { email: trimmed }));
      } else {
        // Never imply an email went out when it did not. Offer the link so the
        // family is not stuck waiting on a mail server.
        const reason =
          result.deliveryReason === 'mail_not_configured'
            ? t('invite.mailNotConfigured')
            : t('invite.mailFailed');

        if (result.token) {
          await Clipboard.setStringAsync(result.token);
          await dialog.confirm({
            title: t('invite.notEmailedTitle'),
            message: `${reason}\n\n${t('invite.tokenCopied')}`,
            confirmLabel: t('common.ok'),
          });
        } else {
          toast.error(reason);
        }
      }

      setEmail('');
      await load();
    } catch (e) {
      setFormError(e.message || t('invite.sendFailed'));
    } finally {
      setSending(false);
    }
  }, [email, t, toast, dialog, load]);

  const handleRevoke = useCallback(
    async (item) => {
      const ok = await dialog.confirm({
        title: t('invite.revokeTitle'),
        message: t('invite.revokeMessage', { email: item.email }),
        confirmLabel: t('invite.revoke'),
        destructive: true,
      });
      if (!ok) return;
      try {
        await revokeInvitation(item._id);
        toast.success(t('invite.revoked'));
        await load();
      } catch (e) {
        toast.error(e.message || t('invite.revokeFailed'));
      }
    },
    [dialog, toast, load, t],
  );

  const renderItem = useCallback(
    ({ item }) => {
      const tone = colors[STATUS_TONE[item.status]] ?? colors.textSecondary;
      return (
        <Card style={{ marginBottom: 10 }}>
          <View style={styles.row}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14.5 * layout.fontScale }}
                numberOfLines={1}
              >
                {item.email}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12.5 * layout.fontScale, marginTop: 3 }}>
                {t(`invite.status_${item.status}`)}
                {' · '}
                {item.emailSent ? t('invite.emailed') : t('invite.notEmailed')}
              </Text>
            </View>

            <View style={[styles.dot, { backgroundColor: tone, borderRadius: radii.full }]} />

            {item.status === 'pending' ? (
              <Ionicons
                name="close-circle-outline"
                size={20}
                color={colors.textTertiary}
                onPress={() => handleRevoke(item)}
                accessibilityRole="button"
                accessibilityLabel={t('invite.revokeA11y', { email: item.email })}
              />
            ) : null}
          </View>
        </Card>
      );
    },
    [colors, layout, radii, handleRevoke, t],
  );

  return (
    <Screen edges={['top']}>
      <PageHeader title={t('invite.title')} subtitle={t('invite.subtitle')} onBack={() => navigation.goBack()} />

      <Card style={{ marginBottom: 16 }}>
        {formError ? (
          <Text style={{ color: colors.error, marginBottom: 10, fontSize: 13.5 * layout.fontScale }}>
            {formError}
          </Text>
        ) : null}
        <TextField
          label={t('invite.emailField')}
          value={email}
          onChangeText={setEmail}
          placeholder="relative@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          hint={t('invite.emailHint')}
        />
        <Button title={t('invite.send')} onPress={handleSend} loading={sending} style={{ marginTop: 10 }} />
      </Card>

      {loadError ? (
        <Card style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.error, fontSize: 14 * layout.fontScale }}>{loadError}</Text>
          <Button title={t('common.retry')} variant="secondary" onPress={load} style={{ marginTop: 10 }} />
        </Card>
      ) : null}

      <SectionTitle title={t('invite.sentInvitations')} style={{ marginBottom: 8 }} />
      <FlatList
        data={invitations}
        keyExtractor={(item) => String(item._id)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={
          loading ? (
            <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale }}>
              {t('common.loading')}
            </Text>
          ) : loadError ? null : (
            <EmptyState icon="mail-outline" title={t('invite.emptyTitle')} description={t('invite.emptyBody')} />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 8, height: 8 },
});
