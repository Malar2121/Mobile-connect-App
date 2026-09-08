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
import { useI18n } from '../../i18n';

export default function CreateFamilyScreen({ navigation }) {
  const { colors, layout } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const { createFamily, refreshFamily } = useFamily();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    setError('');
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('family.nameRequired'));
      return;
    }

    setLoading(true);
    try {
      await createFamily(trimmed);
      await refreshFamily();
      toast.success(t('family.created'));
      navigation.dispatch(CommonActions.navigate({ name: 'Dashboard' }));
    } catch (e) {
      toast.error(e.message || t('family.createFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen edges={['top']} scroll>
      <PageHeader title={t('family.createTitle')} onBack={() => navigation.goBack()} />
      <Text
        style={{
          color: colors.textSecondary,
          marginBottom: layout.sectionGap,
          fontSize: 15 * layout.fontScale,
          lineHeight: 22,
        }}
      >
        {t('family.createHint')}
      </Text>

      <Card>
        {error ? (
          <Text style={{ color: colors.error, marginBottom: 12, fontSize: 14 * layout.fontScale }}>
            {error}
          </Text>
        ) : null}

        <TextField
          label={t('family.nameField')}
          value={name}
          onChangeText={setName}
          placeholder={t('family.namePlaceholder')}
          autoCapitalize="words"
          containerStyle={{ marginBottom: 0 }}
        />

        <Button title={t('family.createButton')} onPress={handleCreate} loading={loading} style={{ marginTop: 12 }} />
      </Card>

      <Button title={t('common.cancel')} variant="ghost" onPress={() => navigation.goBack()} style={{ marginTop: 14 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({});
