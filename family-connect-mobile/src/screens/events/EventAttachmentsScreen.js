import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { Button, Card, PageHeader, Screen, useToast } from '../../design-system';
import { loadEventAttachments, saveEventAttachments } from '../../utils/eventModuleHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function EventAttachmentsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const toast = useToast();
  const { colors, layout } = useTheme();
  const { horizontalPadding } = useResponsive();
  const { eventId } = route.params ?? {};

  const [attachments, setAttachments] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (eventId) loadEventAttachments(eventId).then(setAttachments);
  }, [eventId]);

  const pickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file) return;
      setAttachments((prev) => [
        {
          id: Date.now().toString(),
          name: file.name,
          uri: file.uri,
          mimeType: file.mimeType,
          addedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch (e) {
      toast.error(e.message || 'Could not pick file');
    }
  }, [toast]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveEventAttachments(eventId, attachments);
      toast.success('Attachments saved locally');
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [eventId, attachments, toast]);

  return (
    <Screen edges={['top']}>
      <PageHeader title="Attachments" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 32 }}>
        <Text style={{ color: colors.textSecondary, marginBottom: 16, fontSize: 14 * layout.fontScale }}>
          Attach menus, tickets, or planning docs. Stored on-device until backend file upload API is available.
        </Text>
        <Button title="Add attachment" onPress={pickFile} />
        {attachments.map((a) => (
          <Card key={a.id} style={{ marginTop: 10 }}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }}>{a.name}</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{a.mimeType ?? 'file'}</Text>
          </Card>
        ))}
        <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 12 }}>
          TODO: POST /api/events/:id/attachments for server-side storage.
        </Text>
        <Button title="Save" onPress={handleSave} loading={saving} style={{ marginTop: 16 }} />
      </ScrollView>
    </Screen>
  );
}
