import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { Button, Card, PageHeader, Screen, useToast } from '../../design-system';
import { updateEvent, getEventDetails } from '../../services/eventService';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';
import { useI18n } from '../../i18n';

export default function EventAttachmentsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const toast = useToast();
  const { colors, layout } = useTheme();

  const { t } = useI18n();
  const { horizontalPadding } = useResponsive();
  const { eventId } = route.params ?? {};

  const [attachments, setAttachments] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (eventId) {
      getEventDetails(eventId).then(res => {
        if (res.event?.attachments) {
          setAttachments(res.event.attachments);
        } else if (res.attachments) {
          setAttachments(res.attachments);
        }
      }).catch(() => {
        // failed to load details
      });
    }
  }, [eventId]);

  const pickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file) return;
      setAttachments((prev) => [
        {
          name: file.name,
          url: file.uri, // Using local URI for now, would be uploaded to Cloudinary
          type: file.mimeType?.startsWith('image/') ? 'image' : 
                file.mimeType?.startsWith('video/') ? 'video' : 'document',
        },
        ...prev,
      ]);
    } catch (e) {
      toast.error(e.message || t('events.couldNotPickFile'));
    }
  }, [toast]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateEvent(eventId, { attachments });
      toast.success(t('events.attachmentsSaved'));
    } catch (e) {
      toast.error(e.message || t('events.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [eventId, attachments, toast]);

  return (
    <Screen edges={['top']}>
      <PageHeader title={t('events.attachments')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={{ color: colors.textSecondary, marginBottom: 16, fontSize: 14 * layout.fontScale }}>
          {t('events.attachMenusTicketsOrPlanningDocuments')}
        </Text>
        <Button title={t('events.addAttachment')} onPress={pickFile} />
        {attachments.map((a, i) => (
          <Card key={a._id || i} style={{ marginTop: 10 }}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }}>{a.name}</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{a.type || t('events.file')}</Text>
          </Card>
        ))}
        <Button title={t('common.save')} onPress={handleSave} loading={saving} style={{ marginTop: 16 }} />
      </ScrollView>
    </Screen>
  );
}
