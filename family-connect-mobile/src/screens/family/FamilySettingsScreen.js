import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, PageHeader, Card, Button, TextField, useToast, useDialog } from '../../design-system';
import { useFamilyModuleData } from '../../hooks/useFamilyModuleData';
import { leaveFamily, updateFamily } from '../../services/familyService';
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
  const [localName, setLocalName] = useState('');
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (familyId) {
      loadFamilyMotto(familyId).then(setLocalMotto);
    }
  }, [familyId]);

  useEffect(() => {
    if (family?.name) {
      setLocalName(family.name);
    }
  }, [family]);

  const saveSettings = useCallback(async () => {
    setSaving(true);
    try {
      await saveFamilyMotto(familyId, localMotto);
      setMotto(localMotto);
      if (localName.trim() !== family?.name) {
        await updateFamily({ name: localName.trim() });
        await refreshFamily();
      }
      toast.success('Settings saved');
    } catch (e) {
      toast.error(e.message || 'Could not save settings');
    } finally {
      setSaving(false);
    }
  }, [familyId, localMotto, localName, family?.name, setMotto, toast, refreshFamily]);

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
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {canManage ? (
          <Card>
            <TextField
              label="Family name"
              value={localName}
              onChangeText={setLocalName}
              placeholder="e.g. The Smith Family"
            />
            <TextField
              label="Family motto (optional)"
              value={localMotto}
              onChangeText={setLocalMotto}
              placeholder="Together we grow stronger"
              multiline
              style={{ marginTop: 12 }}
            />
            <Button title="Save changes" onPress={saveSettings} loading={saving} style={{ marginTop: 16 }} />
          </Card>
        ) : (
          <Card>
            <Text style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale, marginBottom: 8 }}>
              Family name
            </Text>
            <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 20 * layout.fontScale }}>
              {family?.name}
            </Text>
            {motto ? (
              <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginTop: 8 }}>
                "{motto}"
              </Text>
            ) : null}
          </Card>
        )}

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
