import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Button, Card, PageHeader, Screen, TextField, useToast } from '../../design-system';
import { ReminderCard } from '../../components/events';
import { deriveReminders } from '../../utils/dashboardHelpers';
import { useFamily } from '../../contexts/FamilyContext';
import { useEventsModuleData } from '../../hooks/useEventsModuleData';
import { loadEventReminders, saveEventReminders } from '../../utils/eventModuleHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function EventReminderScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const toast = useToast();
  const { colors, layout } = useTheme();
  const { horizontalPadding } = useResponsive();
  const { family } = useFamily();
  const { upcomingEvents } = useEventsModuleData();
  const { eventId } = route.params ?? {};

  const [reminders, setReminders] = useState([]);
  const [customTitle, setCustomTitle] = useState('');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  const eventReminders = deriveReminders(upcomingEvents);

  useEffect(() => {
    if (family?._id) loadEventReminders(family._id).then(setReminders);
  }, [family?._id]);

  useEffect(() => {
    if (pushEnabled) {
      Notifications.requestPermissionsAsync().then(({ status }) => {
        if (status !== 'granted') {
          toast.error('Push notifications permission denied.');
          setPushEnabled(false);
        }
      });
    }
  }, [pushEnabled, toast]);

  const addCustom = useCallback(async () => {
    if (!customTitle.trim()) return;
    
    if (pushEnabled) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Family Connect Reminder',
            body: customTitle.trim(),
          },
          trigger: { seconds: 60 }, // Demo: triggers in 60s
        });
        toast.success('Notification scheduled!');
      } catch (e) {
        toast.error('Failed to schedule push notification.');
      }
    }

    setReminders((prev) => [
      { id: Date.now().toString(), title: customTitle.trim(), type: 'custom', at: new Date().toISOString() },
      ...prev,
    ]);
    setCustomTitle('');
  }, [customTitle, pushEnabled, toast]);

  const handleSave = useCallback(async () => {
    if (!family?._id) return;
    setSaving(true);
    try {
      await saveEventReminders(family._id, reminders);
      toast.success('Reminders saved locally');
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [family?._id, reminders, toast]);

  return (
    <Screen edges={['top']}>
      <PageHeader title="Reminders" subtitle="Never miss a family moment" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 32 }}>
        <Card>
          <View style={styles.row}>
            <Text style={{ color: colors.text, flex: 1, fontSize: 15 * layout.fontScale }}>Push notifications</Text>
            <Switch value={pushEnabled} onValueChange={setPushEnabled} accessibilityLabel="Push notifications" />
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 8 }}>
            Note: Custom reminders added here will schedule a demo local notification in 60 seconds if push is enabled.
          </Text>
        </Card>

        <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', marginTop: 20, marginBottom: 10 }}>Event reminders</Text>
        {eventReminders.slice(0, 5).map((r) => (
          <ReminderCard key={r.id} reminder={{ ...r, icon: 'calendar-outline' }} />
        ))}

        <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', marginTop: 20, marginBottom: 10 }}>Custom reminders</Text>
        <TextField label="New reminder" value={customTitle} onChangeText={setCustomTitle} placeholder="Call Grandma before dinner" />
        <Button title="Add reminder" variant="secondary" onPress={addCustom} style={{ marginBottom: 12 }} />

        {reminders.map((r) => (
          <Card key={r.id} style={{ marginBottom: 8 }}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }}>{r.title}</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{r.type} · {new Date(r.at).toLocaleString()}</Text>
          </Card>
        ))}

        <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 12 }}>
          Birthday and anniversary reminders are inferred from event titles until dedicated User DOB APIs exist.
        </Text>

        <Button title="Save reminders" onPress={handleSave} loading={saving} style={{ marginTop: 20 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
