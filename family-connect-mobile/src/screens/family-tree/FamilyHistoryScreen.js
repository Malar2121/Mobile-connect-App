import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PageHeader, Screen, SectionTitle, TextField, Button, useToast } from '../../design-system';
import { useFamilyTreeModuleData } from '../../hooks/useFamilyTreeModuleData';
import { saveFamilyHistory, DEFAULT_FAMILY_HISTORY } from '../../utils/familyTreeModuleHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

const SECTIONS = [
  { key: 'origins', title: 'Origins', placeholder: 'Where does your family come from?' },
  { key: 'traditions', title: 'Traditions', placeholder: 'Holiday rituals, recipes, customs…' },
  { key: 'culturalNotes', title: 'Cultural notes', placeholder: 'Language, heritage, identity…' },
  { key: 'importantEvents', title: 'Important events', placeholder: 'Migrations, reunions, milestones…' },
  { key: 'achievements', title: 'Family achievements', placeholder: 'Collective accomplishments…' },
  { key: 'historicalMemories', title: 'Historical memories', placeholder: 'Stories passed down generations…' },
];

export default function FamilyHistoryScreen() {
  const navigation = useNavigation();
  const toast = useToast();
  const { colors, layout } = useTheme();
  const { horizontalPadding } = useResponsive();
  const { family, familyHistory, setFamilyHistory } = useFamilyTreeModuleData();
  const [draft, setDraft] = useState(familyHistory ?? DEFAULT_FAMILY_HISTORY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (familyHistory) setDraft(familyHistory);
  }, [familyHistory]);

  const updateField = useCallback((key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!family?._id) return;
    setSaving(true);
    try {
      await saveFamilyHistory(family._id, draft);
      setFamilyHistory(draft);
      toast.success('Family journal saved');
    } catch {
      toast.error('Could not save journal');
    } finally {
      setSaving(false);
    }
  }, [family, draft, setFamilyHistory, toast]);

  return (
    <Screen edges={['top']}>
      <PageHeader title="Family history" subtitle="Digital family journal" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginBottom: 16, lineHeight: 22 }}>
          Preserve origins, traditions, and stories. Stored on device until a shared family journal API is available.
        </Text>

        {SECTIONS.map((section) => (
          <View key={section.key} style={{ marginBottom: layout.sectionGap }}>
            <SectionTitle title={section.title} />
            <TextField
              value={draft[section.key] ?? ''}
              onChangeText={(v) => updateField(section.key, v)}
              placeholder={section.placeholder}
              multiline
              numberOfLines={4}
              style={{ minHeight: 100, textAlignVertical: 'top' }}
            />
          </View>
        ))}

        <Button title="Save journal" onPress={handleSave} loading={saving} />
      </ScrollView>
    </Screen>
  );
}
