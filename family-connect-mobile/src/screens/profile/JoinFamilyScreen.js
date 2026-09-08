import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
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

export default function JoinFamilyScreen({ navigation }) {
  const { colors, layout } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const { joinFamily, refreshFamily } = useFamily();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleJoin() {
    setError('');
    const trimmed = inviteCode.trim();
    if (!trimmed) {
      setError(t('family.inviteCodeRequired'));
      return;
    }

    setLoading(true);
    try {
      const result = await joinFamily(trimmed);
      if (result?.pending) {
        toast.success(result.message || t('family.joinRequestSent'));
        navigation.goBack();
        return;
      }
      await refreshFamily();
      toast.success(t('family.welcome'));
      navigation.dispatch(CommonActions.navigate({ name: 'Dashboard' }));
    } catch (e) {
      toast.error(e.message || t('family.joinFailed'));
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
        {t('family.joinHint')}
      </Text>

      <Card>
        {error ? (
          <Text style={{ color: colors.error, marginBottom: 12, fontSize: 14 * layout.fontScale }}>
            {error}
          </Text>
        ) : null}

        <TextField
          label={t('family.inviteCodeField')}
          value={inviteCode}
          onChangeText={setInviteCode}
          placeholder="ABCD-EFGH"
          autoCapitalize="characters"
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

const styles = StyleSheet.create({});
