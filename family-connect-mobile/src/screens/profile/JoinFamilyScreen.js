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

export default function JoinFamilyScreen({ navigation }) {
  const { colors, layout } = useTheme();
  const toast = useToast();
  const { joinFamily, refreshFamily } = useFamily();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleJoin() {
    setError('');
    const trimmed = inviteCode.trim();
    if (!trimmed) {
      setError('Invite code is required.');
      return;
    }

    setLoading(true);
    try {
      const result = await joinFamily(trimmed);
      if (result?.pending) {
        toast.success(result.message || 'Join request sent. An admin must approve your request.');
        navigation.goBack();
        return;
      }
      await refreshFamily();
      toast.success('Welcome to the family!');
      navigation.dispatch(CommonActions.navigate({ name: 'Dashboard' }));
    } catch (e) {
      toast.error(e.message || 'Could not join family');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen edges={['top']} scroll>
      <PageHeader title="Join a family" onBack={() => navigation.goBack()} />
      <Text
        style={{
          color: colors.textSecondary,
          marginBottom: layout.sectionGap,
          fontSize: 15 * layout.fontScale,
          lineHeight: 22,
        }}
      >
        Enter the invite code shared by your family admin (format: ABCD-EFGH).
      </Text>

      <Card>
        {error ? (
          <Text style={{ color: colors.error, marginBottom: 12, fontSize: 14 * layout.fontScale }}>
            {error}
          </Text>
        ) : null}

        <TextField
          label="Invite code"
          value={inviteCode}
          onChangeText={setInviteCode}
          placeholder="ABCD-EFGH"
          autoCapitalize="characters"
          containerStyle={{ marginBottom: 0 }}
        />

        <Button title="Join family" onPress={handleJoin} loading={loading} style={{ marginTop: 12 }} />
      </Card>

      <Button title="Cancel" variant="ghost" onPress={() => navigation.goBack()} style={{ marginTop: 14 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({});
