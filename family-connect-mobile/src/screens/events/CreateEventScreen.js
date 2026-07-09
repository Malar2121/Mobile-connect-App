import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Chip, PageHeader, Screen, TextField, useToast } from '../../design-system';
import { CategoryChip } from '../../components/events';
import { useTheme } from '../../hooks/useTheme';
import { createEvent } from '../../services/eventService';
import { EVENT_CATEGORIES, saveEventMeta } from '../../utils/eventModuleHelpers';

const STEPS = ['General', 'Schedule', 'Details', 'Review'];
const REPEAT_OPTIONS = [
  { id: 'none', label: 'Does not repeat' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

export default function CreateEventScreen({ navigation }) {
  const { colors, layout } = useTheme();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('gathering');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState('');
  const [repeat, setRepeat] = useState('none');
  const [privacy, setPrivacy] = useState('family');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    const t = title.trim();
    if (!t) {
      setError('Title is required.');
      setStep(0);
      return;
    }

    let datePayload;
    if (date.trim()) {
      const parsed = new Date(date.trim());
      if (Number.isNaN(parsed.getTime())) {
        setError('Use a valid date (YYYY-MM-DD).');
        setStep(1);
        return;
      }
      datePayload = parsed.toISOString();
    }

    setLoading(true);
    try {
      const created = await createEvent({
        title: t,
        description: description.trim() || undefined,
        date: datePayload,
        startTime: startTime.trim() || undefined,
        endTime: endTime.trim() || undefined,
        location: location.trim() || undefined,
        image: image.trim() || undefined,
      });
      await saveEventMeta(created._id, { category, repeat, privacy, maxParticipants: maxParticipants || null });
      toast.success('Event created');
      navigation.replace('EventDetails', { id: String(created._id) });
    } catch (e) {
      toast.error(e.message || 'Could not create event');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen edges={['top']} scroll>
      <PageHeader title="New event" subtitle={`Step ${step + 1} of ${STEPS.length} — ${STEPS[step]}`} onBack={() => (step > 0 ? setStep(step - 1) : navigation.goBack())} />
      <View style={styles.steps}>
        {STEPS.map((s, i) => (
          <Chip key={s} label={s} selected={i === step} onPress={() => setStep(i)} />
        ))}
      </View>

      {error ? <Text style={{ color: colors.error, marginBottom: 12 }}>{error}</Text> : null}

      {step === 0 ? (
        <>
          <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Family BBQ" />
          <TextField label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={4} placeholder="What's the plan?" />
          <Text style={{ color: colors.textSecondary, marginBottom: 8, marginTop: 8 }}>Category</Text>
          <View style={styles.chips}>
            {EVENT_CATEGORIES.map((c) => (
              <CategoryChip key={c.id} label={c.label} color={c.color} selected={category === c.id} onPress={() => setCategory(c.id)} />
            ))}
          </View>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <TextField label="Date" value={date} onChangeText={setDate} placeholder="2026-07-15" hint="YYYY-MM-DD" />
          <TextField label="Start time" value={startTime} onChangeText={setStartTime} placeholder="18:00" />
          <TextField label="End time" value={endTime} onChangeText={setEndTime} placeholder="21:00" />
          <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 8 }}>TODO: Repeat rules stored locally until backend recurrence API.</Text>
          <View style={[styles.chips, { marginTop: 12 }]}>
            {REPEAT_OPTIONS.map((r) => (
              <Chip key={r.id} label={r.label} selected={repeat === r.id} onPress={() => setRepeat(r.id)} />
            ))}
          </View>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <TextField label="Location" value={location} onChangeText={setLocation} placeholder="Home, park, restaurant…" />
          <TextField label="Cover image URL" value={image} onChangeText={setImage} placeholder="https://…" />
          <TextField label="Max participants" value={maxParticipants} onChangeText={setMaxParticipants} placeholder="Optional" keyboardType="number-pad" />
          <Text style={{ color: colors.textSecondary, marginTop: 12, marginBottom: 8 }}>Privacy</Text>
          <View style={styles.chips}>
            <Chip label="Family only" selected={privacy === 'family'} onPress={() => setPrivacy('family')} />
            <Chip label="Invitees only" selected={privacy === 'invitees'} onPress={() => setPrivacy('invitees')} />
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 8 }}>TODO: Reminder scheduling — configure in Event Reminders after creation.</Text>
        </>
      ) : null}

      {step === 3 ? (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 20 * layout.fontScale }}>{title || 'Untitled'}</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>{description || 'No description'}</Text>
          <Text style={{ color: colors.text, marginTop: 12 }}>{date || 'Date TBD'} {startTime ? `· ${startTime}` : ''}</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{location || 'No location'}</Text>
          <CategoryChip label={EVENT_CATEGORIES.find((c) => c.id === category)?.label} color={EVENT_CATEGORIES.find((c) => c.id === category)?.color} />
        </View>
      ) : null}

      {step < STEPS.length - 1 ? (
        <Button title="Continue" onPress={() => setStep(step + 1)} size="lg" style={{ marginTop: 16 }} />
      ) : (
        <Button title="Create event" onPress={handleSubmit} loading={loading} size="lg" style={{ marginTop: 16, marginBottom: 32 }} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  steps: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
