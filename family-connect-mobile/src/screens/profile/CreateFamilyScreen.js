import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
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

export default function CreateFamilyScreen({ navigation }) {
  const { colors, layout } = useTheme();
  const toast = useToast();
  const { createFamily, refreshFamily } = useFamily();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    setError('');
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Family name is required.');
      return;
    }

    setLoading(true);
    try {
      await createFamily(trimmed);
      await refreshFamily();
      toast.success('Family created!');
      navigation.dispatch(CommonActions.navigate({ name: 'Dashboard' }));
    } catch (e) {
      toast.error(e.message || 'Could not create family');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen edges={['top']} scroll>
      <PageHeader title="Create a family" onBack={() => navigation.goBack()} />
      <Text
        style={{
          color: colors.textSecondary,
          marginBottom: layout.sectionGap,
          fontSize: 15 * layout.fontScale,
          lineHeight: 22,
        }}
      >
        Start a new family space. You will be the admin and can invite others with a code.
      </Text>

      <Card>
        {error ? (
          <Text style={{ color: colors.error, marginBottom: 12, fontSize: 14 * layout.fontScale }}>
            {error}
          </Text>
        ) : null}

        <TextField
          label="Family name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. The Smith Family"
          autoCapitalize="words"
          containerStyle={{ marginBottom: 0 }}
        />

        <Button title="Create family" onPress={handleCreate} loading={loading} style={{ marginTop: 12 }} />
      </Card>

      <Button title="Cancel" variant="ghost" onPress={() => navigation.goBack()} style={{ marginTop: 14 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({});
