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

const PRIVACY_OPTIONS = [
  { id: 'members_only', label: 'Members only' },
  { id: 'extended', label: 'Extended family' },
  { id: 'private', label: 'Private' },
];

const MEMORY_OPTIONS = [
  { id: 'family', label: 'All family members' },
  { id: 'parents', label: 'Parents & admins' },
  { id: 'self', label: 'Uploader only' },
];

const CHAT_OPTIONS = [
  { id: 'all_members', label: 'All members' },
  { id: 'admins_only', label: 'Admins only' },
  { id: 'parents', label: 'Parents & admins' },
];

const INVITE_OPTIONS = [
  { id: 'admin_only', label: 'Admins only' },
  { id: 'parents', label: 'Parents & admins' },
  { id: 'all_members', label: 'All members' },
];

export default function FamilyPermissionsScreen() {
  const navigation = useNavigation();
  const toast = useToast();
  const { colors, layout } = useTheme();
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
      toast.success('Permissions saved locally');
    } catch (e) {
      toast.error(e.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  }, [familyId, permissions, toast]);

  return (
    <Screen edges={['top']}>
      <PageHeader
        title="Permissions"
        subtitle="Family privacy & sharing"
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginBottom: 16 }}>
          Configure how your family shares content. Settings are stored on-device until a backend permissions API is
          available.
        </Text>

        <PermissionCard
          title="Family privacy"
          description="Who can discover and view your family profile"
          icon="eye-outline"
          options={PRIVACY_OPTIONS}
          selectedOption={permissions.familyPrivacy}
          onSelectOption={(v) => update('familyPrivacy', v)}
          readOnly={!canManage}
          todoNote="TODO: Sync with backend family privacy settings."
        />

        <PermissionCard
          title="Location sharing"
          description="Allow members to share live location on the map"
          icon="location-outline"
          value={permissions.locationSharing}
          onValueChange={(v) => update('locationSharing', v)}
          readOnly={!canManage}
        />

        <PermissionCard
          title="Album sharing"
          description="Enable shared memory albums across the family"
          icon="images-outline"
          value={permissions.albumSharing}
          onValueChange={(v) => update('albumSharing', v)}
          readOnly={!canManage}
        />

        <PermissionCard
          title="Memory visibility"
          description="Default visibility for new memory uploads"
          icon="lock-closed-outline"
          options={MEMORY_OPTIONS}
          selectedOption={permissions.memoryVisibility}
          onSelectOption={(v) => update('memoryVisibility', v)}
          readOnly={!canManage}
        />

        <PermissionCard
          title="Chat permissions"
          description="Who can participate in family chat"
          icon="chatbubbles-outline"
          options={CHAT_OPTIONS}
          selectedOption={permissions.chatPermissions}
          onSelectOption={(v) => update('chatPermissions', v)}
          readOnly={!canManage}
        />

        <PermissionCard
          title="Notifications"
          description="Family-wide notification preferences"
          icon="notifications-outline"
          value={permissions.notificationPreferences}
          onValueChange={(v) => update('notificationPreferences', v)}
          readOnly={!canManage}
        />

        <PermissionCard
          title="Invitation permissions"
          description="Who can invite new members"
          icon="person-add-outline"
          options={INVITE_OPTIONS}
          selectedOption={permissions.invitationPermissions}
          onSelectOption={(v) => update('invitationPermissions', v)}
          readOnly={!canManage}
        />

        {canManage ? (
          <Button title="Save permissions" onPress={handleSave} loading={saving} style={{ marginTop: 8 }} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
