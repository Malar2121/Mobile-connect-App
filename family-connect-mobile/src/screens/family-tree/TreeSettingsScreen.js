import React, { useCallback, useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PageHeader, Screen, SectionTitle, Button, useToast } from '../../design-system';
import { useFamilyTreeModuleData } from '../../hooks/useFamilyTreeModuleData';
import { saveTreeSettings, DEFAULT_TREE_SETTINGS } from '../../utils/familyTreeModuleHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';
import { useI18n } from '../../i18n';

function SettingRow({ label, description, value, onValueChange, colors, layout }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 15 * layout.fontScale }}>{label}</Text>
        {description ? (
          <Text style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale, marginTop: 4 }}>{description}</Text>
        ) : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} accessibilityLabel={label} />
    </View>
  );
}

export default function TreeSettingsScreen() {
  const navigation = useNavigation();
  const toast = useToast();
  const { colors, layout } = useTheme();

  const { t } = useI18n();
  const { horizontalPadding } = useResponsive();
  const { family, treeSettings, setTreeSettings } = useFamilyTreeModuleData();
  const [draft, setDraft] = useState(treeSettings ?? DEFAULT_TREE_SETTINGS);
  const [saving, setSaving] = useState(false);

  const toggle = useCallback((key) => {
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!family?._id) return;
    setSaving(true);
    try {
      await saveTreeSettings(family._id, draft);
      setTreeSettings(draft);
      toast.success(t('tree.settingsSaved'));
    } catch {
      toast.error(t('tree.settingsSaveFailed'));
    } finally {
      setSaving(false);
    }
  }, [family, draft, setTreeSettings, toast]);

  return (
    <Screen edges={['top']}>
      <PageHeader title={t('tree.settingsTitle')} subtitle={t('tree.displayAccessibility')} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionTitle title="Visualization" />
        <SettingRow
          label={t('tree.generationLabels')}
          description={t('tree.generationHint')}
          value={draft.showGenerationLabels}
          onValueChange={() => toggle('showGenerationLabels')}
          colors={colors}
          layout={layout}
        />
        <SettingRow
          label={t('tree.showNicknames')}
          description={t('tree.nicknameHint')}
          value={draft.showNicknames}
          onValueChange={() => toggle('showNicknames')}
          colors={colors}
          layout={layout}
        />
        <SettingRow
          label={t('tree.animatedConnections')}
          description={t('tree.animationHint')}
          value={draft.animateConnections}
          onValueChange={() => toggle('animateConnections')}
          colors={colors}
          layout={layout}
        />
        <SettingRow
          label={t('tree.highlightPath')}
          description={t('tree.highlightHint')}
          value={draft.highlightPath}
          onValueChange={() => toggle('highlightPath')}
          colors={colors}
          layout={layout}
        />

        <SectionTitle title="Accessibility" subtitle={t('tree.elderEnhancements')} />
        <SettingRow
          label={t('tree.largeNodes')}
          description={t('tree.largeNodesHint')}
          value={draft.elderLargeNodes}
          onValueChange={() => toggle('elderLargeNodes')}
          colors={colors}
          layout={layout}
        />

        <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 16, marginBottom: 20 }}>
          Dynamic fonts follow your app accessibility settings. VoiceOver labels are on all tree nodes and controls.
        </Text>

        <Button title={t('tree.saveSettings')} onPress={handleSave} loading={saving} />
      </ScrollView>
    </Screen>
  );
}
