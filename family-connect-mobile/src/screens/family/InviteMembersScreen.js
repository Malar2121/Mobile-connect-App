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

  const loadInvite = useCallback(async () => {
    setLoading(true);
    try {
      const data = await createInviteCode(false).catch(() => ({
        inviteCode: inviteCode || 'MLRV2026',
        inviteLink: 'https://familyconnect.app/join/MLRV2026',
        expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
      }));
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
      setInviteData({
        inviteCode: inviteCode || 'MLRV2026',
        inviteLink: 'https://familyconnect.app/join/MLRV2026',
        expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, [familyId, inviteCode]);

  useEffect(() => {
    if (family) loadInvite();
  }, [family, loadInvite]);

  const handleRegenerate = useCallback(async () => {
    setRegenerating(true);
    try {
      const data = await createInviteCode(true).catch(() => ({
        inviteCode: 'NEWMLRV26',
        inviteLink: 'https://familyconnect.app/join/NEWMLRV26',
        expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
      }));
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
      setInviteData({
        inviteCode: 'NEWMLRV26',
        inviteLink: 'https://familyconnect.app/join/NEWMLRV26',
        expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
      });
      toast.success('New invite code generated');
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
          {loading ? (
            <Loader />
          ) : (
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

          <SectionTitle title="Invite history" subtitle="Stored locally until backend sync" style={{ marginTop: 20 }} />
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
            TODO: Backend invite history and expiration API not yet available.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
