import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, PageHeader, Card, Button, TextField, useToast, useDialog } from '../../design-system';
import { useFamilyModuleData } from '../../hooks/useFamilyModuleData';
import { leaveFamily } from '../../services/familyService';
import { loadFamilyMotto, saveFamilyMotto } from '../../utils/familyModuleHelpers';
import { useFamily } from '../../contexts/FamilyContext';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function FamilySettingsScreen() {
  const navigation = useNavigation();
  const toast = useToast();
  const dialog = useDialog();
  const { colors, layout } = useTheme();
  const { horizontalPadding } = useResponsive();
  const { family, motto, setMotto, canManage, isOwner, familyId } = useFamilyModuleData();
  const { refreshFamily } = useFamily();
  const [localMotto, setLocalMotto] = useState(motto);
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (familyId) {
      loadFamilyMotto(familyId).then(setLocalMotto);
    }
  }, [familyId]);

  const saveMotto = useCallback(async () => {
    setSaving(true);
    try {
      await saveFamilyMotto(familyId, localMotto);
      setMotto(localMotto);
      toast.success('Family motto saved locally');
    } catch (e) {
      toast.error(e.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  }, [familyId, localMotto, setMotto, toast]);

  const handleLeave = useCallback(async () => {
    const confirmed = await dialog.confirm({
      title: 'Leave family?',
      message: 'You will lose access to shared memories, events, and chat.',
      confirmLabel: 'Leave',
      destructive: true,
    });
    if (!confirmed) return;

    setLeaving(true);
    try {
      await leaveFamily();
      await refreshFamily();
      toast.success('You left the family');
      // FamilySettings lives inside the Family stack (nested under ProfileStack as
      // "FamilyModule"); ProfileMain is registered in the PARENT stack, so target
      // the parent explicitly instead of relying on implicit navigate bubbling.
      (navigation.getParent() ?? navigation).navigate('ProfileMain');
    } catch (e) {
      toast.error(e.message || 'Could not leave family');
    } finally {
      setLeaving(false);
    }
  }, [dialog, navigation, refreshFamily, toast]);

  return (
    <Screen edges={['top']}>
      <PageHeader title="Family settings" subtitle={family?.name} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 32 }}>
        <Card>
          <Text style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale, marginBottom: 8 }}>
            Family name
          </Text>
          <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 20 * layout.fontScale }}>
            {family?.name}
          </Text>
          <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 10 }}>
            TODO: Backend PATCH /api/family for name and photo updates.
          </Text>
        </Card>

        {canManage ? (
          <Card style={{ marginTop: 12 }}>
            <TextField
              label="Family motto (optional)"
              value={localMotto}
              onChangeText={setLocalMotto}
              placeholder="Together we grow stronger"
              multiline
            />
            <Button title="Save motto" onPress={saveMotto} loading={saving} style={{ marginTop: 12 }} />
            <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 8 }}>
              Stored locally until family profile API is available.
            </Text>
          </Card>
        ) : null}

        <Card style={{ marginTop: 12 }}>
          <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', marginBottom: 12 }}>Administration</Text>
          <Button title="Permissions & privacy" variant="secondary" onPress={() => navigation.navigate('FamilyPermissions')} />
          <Button title="Join requests" variant="secondary" onPress={() => navigation.navigate('JoinRequests')} style={{ marginTop: 10 }} />
          <Button title="Family roles" variant="secondary" onPress={() => navigation.navigate('FamilyRoles')} style={{ marginTop: 10 }} />
        </Card>

        {!isOwner ? (
          <Button title="Leave family" variant="danger" onPress={handleLeave} loading={leaving} style={{ marginTop: 24 }} />
        ) : (
          <Text style={{ color: colors.textTertiary, fontSize: 13, marginTop: 24, textAlign: 'center' }}>
            Family owners cannot leave until ownership is transferred.
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}
