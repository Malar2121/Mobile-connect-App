import React, { useCallback, useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PageHeader, Screen, SectionTitle, Button, useToast } from '../../design-system';
import { useFamilyTreeModuleData } from '../../hooks/useFamilyTreeModuleData';
import { saveTreeSettings, DEFAULT_TREE_SETTINGS } from '../../utils/familyTreeModuleHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

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
      toast.success('Tree settings saved');
    } catch {
      toast.error('Could not save settings');
    } finally {
      setSaving(false);
    }
  }, [family, draft, setTreeSettings, toast]);

  return (
    <Screen edges={['top']}>
      <PageHeader title="Tree settings" subtitle="Display & accessibility" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionTitle title="Visualization" />
        <SettingRow
          label="Generation labels"
          description="Show Founders, Parents, Children headers"
          value={draft.showGenerationLabels}
          onValueChange={() => toggle('showGenerationLabels')}
          colors={colors}
          layout={layout}
        />
        <SettingRow
          label="Show nicknames"
          description="Display Dad, Amma, etc. on nodes"
          value={draft.showNicknames}
          onValueChange={() => toggle('showNicknames')}
          colors={colors}
          layout={layout}
        />
        <SettingRow
          label="Animated connections"
          description="Smooth line animations"
          value={draft.animateConnections}
          onValueChange={() => toggle('animateConnections')}
          colors={colors}
          layout={layout}
        />
        <SettingRow
          label="Highlight path"
          description="Emphasize selected member connections"
          value={draft.highlightPath}
          onValueChange={() => toggle('highlightPath')}
          colors={colors}
          layout={layout}
        />

        <SectionTitle title="Accessibility" subtitle="Elder mode enhancements" />
        <SettingRow
          label="Large tree nodes"
          description="Bigger avatars and touch targets"
          value={draft.elderLargeNodes}
          onValueChange={() => toggle('elderLargeNodes')}
          colors={colors}
          layout={layout}
        />

        <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 16, marginBottom: 20 }}>
          Dynamic fonts follow your app accessibility settings. VoiceOver labels are on all tree nodes and controls.
        </Text>

        <Button title="Save settings" onPress={handleSave} loading={saving} />
      </ScrollView>
    </Screen>
  );
}
