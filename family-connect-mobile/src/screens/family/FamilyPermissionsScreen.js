import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, PageHeader, Button, useToast } from '../../design-system';
import { PermissionCard } from '../../components/family';
import { useFamilyModuleData } from '../../hooks/useFamilyModuleData';
import {
  getDefaultPermissions,
  loadFamilyPermissions,
  saveFamilyPermissions,
} from '../../utils/familyModuleHelpers';
import { useResponsive } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { useI18n, translate } from '../../i18n';

const PRIVACY_OPTIONS = [
  { id: 'members_only', get label() { return translate('perms.membersOnly'); } },
  { id: 'extended', get label() { return translate('perms.extendedFamily'); } },
  { id: 'private', get label() { return translate('family.private'); } },
];

const MEMORY_OPTIONS = [
  { id: 'family', get label() { return translate('perms.allFamily'); } },
  { id: 'parents', get label() { return translate('perms.parentsAdmins'); } },
  { id: 'self', get label() { return translate('perms.uploaderOnly'); } },
];

const CHAT_OPTIONS = [
  { id: 'all_members', get label() { return translate('perms.allMembers'); } },
  { id: 'admins_only', get label() { return translate('perms.adminsOnly'); } },
  { id: 'parents', get label() { return translate('perms.parentsAdmins'); } },
];

const INVITE_OPTIONS = [
  { id: 'admin_only', get label() { return translate('perms.adminsOnly'); } },
  { id: 'parents', get label() { return translate('perms.parentsAdmins'); } },
  { id: 'all_members', get label() { return translate('perms.allMembers'); } },
];

export default function FamilyPermissionsScreen() {
  const navigation = useNavigation();
  const toast = useToast();
  const { colors, layout } = useTheme();

  const { t } = useI18n();
  const { horizontalPadding } = useResponsive();
  const { familyId, canManage } = useFamilyModuleData();
  const [permissions, setPermissions] = useState(getDefaultPermissions());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (familyId) loadFamilyPermissions(familyId).then(setPermissions);
  }, [familyId]);

  const update = useCallback((key, value) => {
    setPermissions((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveFamilyPermissions(familyId, permissions);
      toast.success(t('perms.saved'));
    } catch (e) {
      toast.error(e.message || t('family.couldNotSave'));
    } finally {
      setSaving(false);
    }
  }, [familyId, permissions, toast]);

  return (
    <Screen edges={['top']}>
      <PageHeader
        title={t('family.permissions')}
        subtitle={t('perms.subtitle')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginBottom: 16 }}>
          {t('family.configureHowYourFamilySharesContent')}
        </Text>

        <PermissionCard
          title={t('perms.familyPrivacy')}
          description={t('perms.discoverHint')}
          icon="eye-outline"
          options={PRIVACY_OPTIONS}
          selectedOption={permissions.familyPrivacy}
          onSelectOption={(v) => update('familyPrivacy', v)}
          readOnly={!canManage}
          note={t('perms.localNote')}
        />

        <PermissionCard
          title={t('perms.locationSharing')}
          description={t('perms.locationHint')}
          icon="location-outline"
          value={permissions.locationSharing}
          onValueChange={(v) => update('locationSharing', v)}
          readOnly={!canManage}
        />

        <PermissionCard
          title={t('perms.albumSharing')}
          description={t('perms.albumHint')}
          icon="images-outline"
          value={permissions.albumSharing}
          onValueChange={(v) => update('albumSharing', v)}
          readOnly={!canManage}
        />

        <PermissionCard
          title={t('perms.memoryVisibility')}
          description={t('perms.memoryHint')}
          icon="lock-closed-outline"
          options={MEMORY_OPTIONS}
          selectedOption={permissions.memoryVisibility}
          onSelectOption={(v) => update('memoryVisibility', v)}
          readOnly={!canManage}
        />

        <PermissionCard
          title={t('perms.chatPermissions')}
          description={t('perms.chatHint')}
          icon="chatbubbles-outline"
          options={CHAT_OPTIONS}
          selectedOption={permissions.chatPermissions}
          onSelectOption={(v) => update('chatPermissions', v)}
          readOnly={!canManage}
        />

        <PermissionCard
          title={t('notifications.title')}
          description={t('perms.notificationHint')}
          icon="notifications-outline"
          value={permissions.notificationPreferences}
          onValueChange={(v) => update('notificationPreferences', v)}
          readOnly={!canManage}
        />

        <PermissionCard
          title={t('perms.invitePermissions')}
          description={t('perms.inviteHint')}
          icon="person-add-outline"
          options={INVITE_OPTIONS}
          selectedOption={permissions.invitationPermissions}
          onSelectOption={(v) => update('invitationPermissions', v)}
          readOnly={!canManage}
        />

        {canManage ? (
          <Button title={t('perms.save')} onPress={handleSave} loading={saving} style={{ marginTop: 8 }} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
