import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PageHeader, Screen, SectionTitle, Button, useToast } from '../../design-system';
import { useMapModule } from '../../contexts/MapModuleContext';
import { useAccessibilityPolicy } from '../../hooks/useAccessibilityPolicy';
import { useI18n } from '../../i18n';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

function SettingRow({ label, description, value, onValueChange, colors, layout, disabled }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 15 * layout.fontScale }}>{label}</Text>
        {description ? <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={label}
        accessibilityHint={description}
        accessibilityState={{ disabled, checked: value }}
      />
    </View>
  );
}

export default function LocationSettingsScreen() {
  const navigation = useNavigation();
  const toast = useToast();
  const { horizontalPadding } = useResponsive();
  const { colors, layout } = useTheme();
  const { t } = useI18n();
  const policy = useAccessibilityPolicy();
  const { locationSettings, saveSettings, toggleSharing, sharing } = useMapModule();
  const [draft, setDraft] = useState(locationSettings ?? {});

  useEffect(() => {
    if (locationSettings) setDraft(locationSettings);
  }, [locationSettings]);

  const toggle = useCallback((key) => setDraft((p) => ({ ...p, [key]: !p[key] })), []);

  const handleSave = useCallback(async () => {
    await saveSettings(draft);
    if (draft.shareLocation !== sharing) {
      await toggleSharing(draft.shareLocation && policy.canControlLocationSharing);
    }
    toast.success(t('map.settingsSaved'));
  }, [draft, saveSettings, sharing, toggleSharing, toast, t, policy.canControlLocationSharing]);

  const shareDisabled = !policy.canControlLocationSharing;
  const precisionDisabled = !policy.canUseHighPrecisionLocation;

  return (
    <Screen edges={['top']}>
      <PageHeader title={t('map.locationSettings')} subtitle={t('map.locationSubtitle')} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 40 }}>
        <SectionTitle title={t('map.shareLocation')} />
        <SettingRow
          label={t('map.shareLocation')}
          description={shareDisabled ? t('map.shareLocationMinor') : t('map.shareLocationDesc')}
          value={draft.shareLocation && !shareDisabled}
          onValueChange={() => !shareDisabled && toggle('shareLocation')}
          disabled={shareDisabled}
          colors={colors}
          layout={layout}
        />
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginVertical: 12 }}>
          Who can see me: {draft.visibility ?? 'family'}
        </Text>

        <SectionTitle title={t('map.locationSettings')} />
        <SettingRow
          label="High precision"
          description="More accurate GPS"
          value={draft.highPrecision && !precisionDisabled}
          onValueChange={() => !precisionDisabled && toggle('highPrecision')}
          disabled={precisionDisabled}
          colors={colors}
          layout={layout}
        />
        <SettingRow
          label="Background tracking"
          description="TODO: requires always-on permission"
          value={draft.backgroundTracking}
          onValueChange={() => toggle('backgroundTracking')}
          disabled={shareDisabled}
          colors={colors}
          layout={layout}
        />
        <SettingRow
          label="Battery optimization"
          description="Reduce update frequency"
          value={draft.batteryOptimization}
          onValueChange={() => toggle('batteryOptimization')}
          colors={colors}
          layout={layout}
        />
        <SettingRow
          label={t('map.safeZones')}
          value={draft.notifyZones}
          onValueChange={() => toggle('notifyZones')}
          colors={colors}
          layout={layout}
        />

        <Button title={t('map.saveSettings')} onPress={handleSave} style={{ marginTop: 20 }} />
      </ScrollView>
    </Screen>
  );
}
