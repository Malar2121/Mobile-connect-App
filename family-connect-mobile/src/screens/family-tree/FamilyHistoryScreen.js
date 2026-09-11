import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PageHeader, Screen, SectionTitle, TextField, Button, useToast } from '../../design-system';
import { useAuth } from '../../contexts/AuthContext';
import { useFamilyTreeModuleData } from '../../hooks/useFamilyTreeModuleData';
import { DEFAULT_FAMILY_HISTORY } from '../../utils/familyTreeModuleHelpers';
import { HISTORY_FIELDS, HISTORY_FIELD_MAX, updateFamilyHistory } from '../../services/archiveService';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';

/**
 * The shared family history journal — origins, traditions and the stories
 * passed down through generations. Saved on the server, so every member of the
 * family reads the same text on every device.
 */
export default function FamilyHistoryScreen() {
  const navigation = useNavigation();
  const toast = useToast();
  const { user } = useAuth();
  const { colors, layout } = useTheme();
  const { t } = useI18n();
  const { family, familyHistory, setFamilyHistory } = useFamilyTreeModuleData();

  const [draft, setDraft] = useState(familyHistory ?? DEFAULT_FAMILY_HISTORY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Guests read the journal but cannot change it (the server enforces this too).
  const readOnly = user?.role === 'guest';

  useEffect(() => {
    if (familyHistory) setDraft(familyHistory);
  }, [familyHistory]);

  const updateField = useCallback((key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!family?._id || readOnly) return;
    if (HISTORY_FIELDS.some((field) => (draft[field] ?? '').length > HISTORY_FIELD_MAX)) {
      setError(t('tree.historyTooLong'));
      return;
    }
    setError('');
    setSaving(true);
    try {
      const saved = await updateFamilyHistory(draft);
      setFamilyHistory(saved);
      toast.success(t('tree.journalSaved'));
    } catch {
      toast.error(t('tree.journalSaveFailed'));
    } finally {
      setSaving(false);
    }
  }, [family, draft, readOnly, setFamilyHistory, toast, t]);

  const updatedBy = familyHistory?.updatedBy?.fullName;

  return (
    <Screen edges={['top']}>
      <PageHeader title={t('tree.history')} subtitle={t('tree.journalSubtitle')} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginBottom: 8, lineHeight: 22 }}>
            {t('tree.historyIntro')}
          </Text>
          {updatedBy ? (
            <Text style={{ color: colors.textTertiary, fontSize: 12 * layout.fontScale, marginBottom: 16 }}>
              {t('tree.historyUpdatedBy', { name: updatedBy })}
            </Text>
          ) : null}
          {readOnly ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale, marginBottom: 16 }}>
              {t('tree.historyReadOnly')}
            </Text>
          ) : null}

          {HISTORY_FIELDS.map((key) => (
            <View key={key} style={{ marginBottom: layout.sectionGap }}>
              <SectionTitle title={t(`tree.historySections.${key}`)} />
              <TextField
                value={draft[key] ?? ''}
                onChangeText={(value) => updateField(key, value)}
                placeholder={t(`tree.historyPlaceholders.${key}`)}
                accessibilityLabel={t(`tree.historySections.${key}`)}
                multiline
                numberOfLines={4}
                maxLength={HISTORY_FIELD_MAX}
                editable={!readOnly}
                style={{ minHeight: 100, textAlignVertical: 'top' }}
              />
            </View>
          ))}

          {error ? (
            <Text style={{ color: colors.error, fontSize: 14 * layout.fontScale, marginBottom: 8 }}>{error}</Text>
          ) : null}

          {!readOnly ? <Button title={t('tree.saveJournal')} onPress={handleSave} loading={saving} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
