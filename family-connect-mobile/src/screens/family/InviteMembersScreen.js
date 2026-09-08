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

export default function InviteMembersScreen() {
  const navigation = useNavigation();
  const toast = useToast();
  const { colors, layout } = useTheme();
  const { horizontalPadding } = useResponsive();
  const { family, inviteCode, canManage, refresh, familyId } = useFamilyModuleData();

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
        await appendInviteHistory(familyId, {
          code: data.inviteCode,
          status: 'active',
          action: 'loaded',
        }).catch(() => {});
        setHistory(await loadInviteHistory(familyId).catch(() => []));
      }
    } catch (e) {
      setInviteData(null);
      setError(e.message || 'Could not load the family invite code.');
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    if (family) loadInvite();
  }, [family, loadInvite]);

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
      toast.success('New invite code generated');
    } catch (e) {
      // Report the failure rather than showing a fabricated new code.
      toast.error(e.message || 'Could not regenerate the invite code.');
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
          ? `Join our family on Family Connect! Code: ${code}\n${link}`
          : `Join our family on Family Connect! Use invite code: ${code}`,
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
        title="Invite members"
        subtitle="Grow your family circle"
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View >
          {error ? (
            <Card style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.error, fontSize: 14 * layout.fontScale }}>{error}</Text>
              <Button title="Try again" variant="secondary" onPress={loadInvite} style={{ marginTop: 12 }} />
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
                title="Show QR code"
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

          <SectionTitle title="Invite history" subtitle="Recent activity on this device" style={{ marginTop: 20 }} />
          {history.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale }}>
              Share or regenerate an invite to build history.
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
            Recent invite activity on this device. For links that expire and work only once, use email invitations.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
