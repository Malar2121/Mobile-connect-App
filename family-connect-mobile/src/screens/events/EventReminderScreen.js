import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { isRunningInExpoGo } from 'expo';
import { Button, Card, PageHeader, Screen, TextField, useToast } from '../../design-system';
import { ReminderCard } from '../../components/events';
import { deriveReminders } from '../../utils/dashboardHelpers';
import { useFamily } from '../../contexts/FamilyContext';
import { useEventsModuleData } from '../../hooks/useEventsModuleData';
import { loadEventReminders, saveEventReminders } from '../../utils/eventModuleHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';
import { useI18n } from '../../i18n';

/** Returns false when running inside Android Expo Go (no FCM push support). */
function canUseLocalNotifications() {
  if (Platform.OS === 'android') {
    try { if (isRunningInExpoGo()) return false; } catch { return false; }
  }
  return true;
}

/** Lazily load expo-notifications only when supported. */
async function getNotifications() {
  return import('expo-notifications');
}

export default function EventReminderScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const toast = useToast();
  const { colors, layout } = useTheme();

  const { t } = useI18n();
  const { horizontalPadding } = useResponsive();
  const { family } = useFamily();
  const { upcomingEvents } = useEventsModuleData();
  const { eventId } = route.params ?? {};

  const [reminders, setReminders] = useState([]);
  const [customTitle, setCustomTitle] = useState('');
  const [customAt, setCustomAt] = useState('');
  const [pushEnabled, setPushEnabled] = useState(canUseLocalNotifications());
  const [saving, setSaving] = useState(false);

  const eventReminders = deriveReminders(upcomingEvents);

  // Request notification permissions once on mount (skip in Android Expo Go)
  useEffect(() => {
    if (!canUseLocalNotifications()) return;
    getNotifications()
      .then((Notifications) => {
        try {
          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: false,
            }),
          });
        } catch { /* ignore */ }

        return Notifications.requestPermissionsAsync();
      })
      .then((result) => {
        if (result && result.status !== 'granted') {
          toast.error(t('events.pushDenied'));
          setPushEnabled(false);
        }
      })
      .catch(() => setPushEnabled(false));
  }, []);

  useEffect(() => {
    if (family?._id) loadEventReminders(family._id).then(setReminders);
  }, [family?._id]);

  const addCustom = useCallback(async () => {
    const title = customTitle.trim();
    if (!title) return;

    const when = new Date(customAt);
    if (!customAt || Number.isNaN(when.getTime())) {
      toast.error(t('events.reminderWhenRequired'));
      return;
    }
    if (when.getTime() <= Date.now()) {
      toast.error(t('events.reminderFuture'));
      return;
    }

    // A personal note fires locally on this device at the time the user chose.
    // Event, birthday and celebration reminders are dispatched server-side by
    // the reminder scheduler, so they arrive on every device and do not depend
    // on this screen having been opened.
    if (pushEnabled && canUseLocalNotifications()) {
      try {
        const Notifications = await getNotifications();
        await Notifications.scheduleNotificationAsync({
          content: { title: t('events.familyConnectReminder'), body: title },
          trigger: { type: 'date', date: when },
        });
        toast.success(t('events.reminderSetForValue', { value: when.toLocaleString() }));
      } catch (e) {
        toast.error(t('events.reminderScheduleFailed'));
        return;
      }
    }

    setReminders((prev) => [
      { id: Date.now().toString(), title, type: 'custom', at: when.toISOString() },
      ...prev,
    ]);
    setCustomTitle('');
    setCustomAt('');
  }, [customTitle, customAt, pushEnabled, toast]);

  const handleSave = useCallback(async () => {
    if (!family?._id) return;
    setSaving(true);
    try {
      await saveEventReminders(family._id, reminders);
      toast.success(t('events.remindersSaved'));
    } catch (e) {
      toast.error(e.message || t('events.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [family?._id, reminders, toast]);

  return (
    <Screen edges={['top']}>
      <PageHeader title={t('events.reminders')} subtitle={t('events.remindersSubtitle')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Card>
          <View style={styles.row}>
            <Text style={{ color: colors.text, flex: 1, fontSize: 15 * layout.fontScale }}>{t('events.pushNotifications')}</Text>
            <Switch value={pushEnabled} onValueChange={setPushEnabled} accessibilityLabel={t('events.pushNotifications')} />
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 8 }}>
            {t('events.eventBirthdayAndCelebrationRemindersAre')}
          </Text>
        </Card>

        <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', marginTop: 20, marginBottom: 10 }}>{t('events.eventReminders')}</Text>
        {eventReminders.slice(0, 5).map((r) => (
          <ReminderCard key={r.id} reminder={{ ...r, icon: 'calendar-outline' }} />
        ))}

        <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', marginTop: 20, marginBottom: 10 }}>{t('events.customReminders')}</Text>
        <TextField label={t('events.newReminder')} value={customTitle} onChangeText={setCustomTitle} placeholder={t('events.reminderExample')} />
        <TextField
          label={t('events.remindMeAt')}
          value={customAt}
          onChangeText={setCustomAt}
          placeholder="2026-12-24 18:00"
          hint={t('events.reminderWhenHint')}
        />
        <Button title={t('events.addReminder')} variant="secondary" onPress={addCustom} style={{ marginBottom: 12 }} />

        {reminders.map((r) => (
          <Card key={r.id} style={{ marginBottom: 8 }}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }}>{r.title}</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{r.type} · {new Date(r.at).toLocaleString()}</Text>
          </Card>
        ))}

        <Button title={t('events.saveReminders')} onPress={handleSave} loading={saving} style={{ marginTop: 20 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
