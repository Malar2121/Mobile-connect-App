import React, { useState } from 'react';
import { Text } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import {
  Button,
  Card,
  PageHeader,
  Screen,
  TextField,
  useToast,
} from '../../design-system';
import { useFamily } from '../../contexts/FamilyContext';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';
import { parseInviteScan } from '../../utils/inviteLink';
import { acceptInvitation, verifyInvitation } from '../../services/invitationService';

const INVITATION_ERRORS = {
  INVALID: 'family.invitationInvalid',
  REVOKED: 'family.invitationRevoked',
  USED: 'family.invitationUsed',
  EXPIRED: 'family.invitationExpired',
  WRONG_ACCOUNT: 'family.invitationWrongAccount',
};

/**
 * Join with the shareable family code, or by pasting the one-time invitation
 * from an email (proposal §6.3: secure onboarding via email or QR code). The
 * same parser the QR scanner uses decides which of the two was entered.
 */
export default function JoinFamilyScreen({ navigation }) {
  const { colors, layout } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const { joinFamily, refreshFamily } = useFamily();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function messageFor(e) {
    if (e?.code && INVITATION_ERRORS[e.code]) return t(INVITATION_ERRORS[e.code]);
    if (!e?.status) return t('family.joinNetworkError');
    if (e.status === 404) return t('family.inviteCodeInvalid');
    if (e.status === 409) return t('family.alreadyMember');
    if (e.status === 400) return t('family.alreadyInFamily');
    return t('family.joinFailed');
  }

  function goToDashboard() {
    navigation.dispatch(CommonActions.navigate({ name: 'Dashboard' }));
  }

  async function handleJoin() {
    setError('');
    if (!input.trim()) {
      setError(t('family.inviteCodeRequired'));
      return;
    }

    const parsed = parseInviteScan(input);
    if (parsed.kind === 'invalid') {
      setError(t('family.inviteNotRecognised'));
      return;
    }

    setLoading(true);
    try {
      if (parsed.kind === 'token') {
        // Name the family before joining, exactly as the QR scanner does.
        const info = await verifyInvitation(parsed.value);
        await acceptInvitation(parsed.value);
        await refreshFamily();
        toast.success(t('scan.joined', { family: info?.familyName ?? '' }));
        goToDashboard();
        return;
      }

      const result = await joinFamily(parsed.value);
      if (result?.pending) {
        toast.success(t('family.joinRequestSent'));
        navigation.goBack();
        return;
      }
      await refreshFamily();
      toast.success(t('family.welcome'));
      goToDashboard();
    } catch (e) {
      const message = messageFor(e);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen edges={['top']} scroll>
      <PageHeader title={t('family.joinTitle')} onBack={() => navigation.goBack()} />
      <Text
        style={{
          color: colors.textSecondary,
          marginBottom: layout.sectionGap,
          fontSize: 15 * layout.fontScale,
          lineHeight: 22,
        }}
      >
        {t('family.joinHintEmail')}
      </Text>

      <Card>
        {error ? (
          <Text
            style={{ color: colors.error, marginBottom: 12, fontSize: 14 * layout.fontScale }}
            accessibilityLiveRegion="polite"
          >
            {error}
          </Text>
        ) : null}

        <TextField
          label={t('family.inviteCodeOrLinkField')}
          value={input}
          onChangeText={setInput}
          placeholder="ABCD-EFGH"
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={{ marginBottom: 0 }}
        />

        <Button title={t('family.joinButton')} onPress={handleJoin} loading={loading} style={{ marginTop: 12 }} />
      </Card>

      <Button
        title={t('family.scanInstead')}
        variant="secondary"
        onPress={() => navigation.navigate('FamilyModule', { screen: 'ScanInvite' })}
        style={{ marginTop: 14 }}
      />

      <Button title={t('common.cancel')} variant="ghost" onPress={() => navigation.goBack()} style={{ marginTop: 14 }} />
    </Screen>
  );
}
