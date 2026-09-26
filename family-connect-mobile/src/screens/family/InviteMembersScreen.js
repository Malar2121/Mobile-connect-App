import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, PageHeader, Button, Loader, SectionTitle, Card } from '../../design-system';
import { InviteCard, QRInviteCard } from '../../components/family';
import { useFamilyModuleData } from '../../hooks/useFamilyModuleData';
import { createInviteCode } from '../../services/familyService';
import { appendInviteHistory, loadInviteHistory } from '../../utils/familyModuleHelpers';
import { useToast } from '../../design-system';
import { useResponsive } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';

export default function InviteMembersScreen() {
  const navigation = useNavigation();
  const toast = useToast();
  const { colors, layout } = useTheme();

  const { t } = useI18n();
  const { horizontalPadding } = useResponsive();
  const { inviteCode, canManage, refresh, familyId } = useFamilyModuleData();

  const [inviteData, setInviteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  const loadInvite = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // No invented fallback code here. Showing a plausible-looking invite that
      // does not exist is worse than showing an error: an admin would share it
      // and the recipient could never join.
      const data = await createInviteCode(false);
      setInviteData(data);
      if (familyId) {
        // Only record a load when the code differs from the latest entry, so
        // simply reopening the screen doesn't flood the history.
        const existing = await loadInviteHistory(familyId).catch(() => []);
        if (existing[0]?.code !== data.inviteCode) {
          await appendInviteHistory(familyId, {
            code: data.inviteCode,
            status: 'active',
            action: 'loaded',
          }).catch(() => {});
        }
        setHistory(await loadInviteHistory(familyId).catch(() => []));
      }
    } catch (e) {
      setInviteData(null);
      setError(e.message || t('family.couldNotLoadTheFamilyInvite'));
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  // Keyed on familyId: the family object is replaced on every refresh, which
  // would re-run this and flash the loader each time.
  useEffect(() => {
    if (familyId) loadInvite();
  }, [familyId, loadInvite]);

  const handleRegenerate = useCallback(async () => {
    setRegenerating(true);
    try {
      const data = await createInviteCode(true);
      setInviteData(data);
      await appendInviteHistory(familyId, {
        code: data.inviteCode,
        status: 'active',
        action: 'regenerated',
      }).catch(() => {});
      setHistory(await loadInviteHistory(familyId).catch(() => []));
      await refresh().catch(() => {});
      toast.success(t('family.newCodeGenerated'));
    } catch (e) {
      // Report the failure rather than showing a fabricated new code.
      toast.error(e.message || t('family.couldNotRegenerateTheInviteCode'));
    } finally {
      setRegenerating(false);
    }
  }, [familyId, refresh, toast]);

  const handleShare = useCallback(async () => {
    const code = inviteData?.inviteCode ?? inviteCode;
    const link = inviteData?.inviteLink;
    try {
      await Share.share({
        message: link
          ? t('family.joinOurFamilyOnFamilyConnect', { code, link })
          : t('family.joinOurFamilyOnFamilyConnect2', { code }),
      });
      if (familyId) {
        await appendInviteHistory(familyId, { code, status: 'shared', action: 'share' });
        setHistory(await loadInviteHistory(familyId));
      }
    } catch {
      /* user cancelled */
    }
  }, [inviteData, inviteCode, familyId]);

  const renderHistory = useCallback(
    ({ item }) => (
      <Card style={{ marginBottom: 8 }}>
        <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }}>{item.code}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
          {item.action} · {new Date(item.at).toLocaleString()}
        </Text>
      </Card>
    ),
    [colors],
  );

  return (
    <Screen edges={['top']}>
      <PageHeader
        title={t('family.inviteMembers')}
        subtitle={t('family.growCircle')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View >
          {error ? (
            <Card style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.error, fontSize: 14 * layout.fontScale }}>{error}</Text>
              <Button title={t('common.tryAgain')} variant="secondary" onPress={loadInvite} style={{ marginTop: 12 }} />
            </Card>
          ) : null}
          {loading ? (
            <Loader />
          ) : error ? null : (
            <>
              <InviteCard
                inviteCode={inviteData?.inviteCode ?? inviteCode}
                inviteLink={inviteData?.inviteLink}
                expiresAt={inviteData?.expiresAt}
                onRegenerate={canManage ? handleRegenerate : undefined}
                onShare={handleShare}
                regenerating={regenerating}
                readOnly={!canManage}
              />
              <Button
                title={t('family.showQr')}
                variant="secondary"
                onPress={() =>
                  navigation.navigate('QRInvite', {
                    inviteCode: inviteData?.inviteCode ?? inviteCode,
                    inviteLink: inviteData?.inviteLink,
                  })
                }
                style={{ marginTop: 12, marginBottom: 16 }}
              />
              <QRInviteCard
                inviteCode={inviteData?.inviteCode ?? inviteCode}
                inviteLink={inviteData?.inviteLink}
              />
            </>
          )}

          <SectionTitle title={t('family.inviteHistory')} subtitle={t('family.recentOnDevice')} style={{ marginTop: 20 }} />
          {history.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale }}>
              {t('family.shareOrRegenerateAnInviteTo')}
            </Text>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              renderItem={renderHistory}
              scrollEnabled={false}
            />
          )}
          <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 12 }}>
            {t('family.recentInviteActivityOnThisDevice')}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
