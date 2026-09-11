import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Chip, PageHeader, Screen, TextField, useToast } from '../../design-system';
import { CategoryChip } from '../../components/events';
import { useTheme } from '../../hooks/useTheme';
import { useI18n, translate } from '../../i18n';
import { createEvent } from '../../services/eventService';
import { EVENT_CATEGORIES, saveEventMeta } from '../../utils/eventModuleHelpers';

const STEP_KEYS = ['events.stepGeneral', 'events.stepSchedule', 'events.stepDetails', 'events.stepReview'];
const REPEAT_OPTIONS = [
  { id: 'none', label: t('events.noRepeat') },
  { id: 'weekly', get label() { return translate('events.weekly'); } },
  { id: 'monthly', get label() { return translate('events.monthly'); } },
];

export default function CreateEventScreen({ navigation }) {
  const { colors, layout } = useTheme();
  const { t } = useI18n();
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
      setError(t('events.titleRequired'));
      setStep(0);
      return;
    }

    let datePayload;
    if (date.trim()) {
      const parsed = new Date(date.trim());
      if (Number.isNaN(parsed.getTime())) {
        setError(t('events.dateInvalid'));
        setStep(1);
        return;
      }
      datePayload = parsed.toISOString();
    }

    setLoading(true);
    try {
      let recurrenceRule;
      if (repeat === 'weekly') recurrenceRule = 'FREQ=WEEKLY';
      else if (repeat === 'monthly') recurrenceRule = 'FREQ=MONTHLY';

      const created = await createEvent({
        title: t,
        description: description.trim() || undefined,
        date: datePayload,
        startTime: startTime.trim() || undefined,
        endTime: endTime.trim() || undefined,
        location: location.trim() || undefined,
        image: image.trim() || undefined,
        recurrenceRule,
      });
      await saveEventMeta(created._id, { category, repeat, privacy, maxParticipants: maxParticipants || null });
      toast.success(t('events.created'));
      navigation.replace('EventDetails', { id: String(created._id) });
    } catch (e) {
      toast.error(e.message || translate('events.couldNotCreateEvent'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen edges={['top']} scroll>
      <PageHeader title={t('events.newEvent')} subtitle={t('events.stepValueOfCountStep', { value: step + 1, count: STEP_KEYS.length, step: t(STEP_KEYS[step]) })} onBack={() => (step > 0 ? setStep(step - 1) : navigation.goBack())} />
      <View style={styles.steps}>
        {STEP_KEYS.map((s, i) => (
          <Chip key={s} label={t(s)} selected={i === step} onPress={() => setStep(i)} />
        ))}
      </View>

      {error ? <Text style={{ color: colors.error, marginBottom: 12 }}>{error}</Text> : null}

      {step === 0 ? (
        <>
          <TextField label={t('events.titleField')} value={title} onChangeText={setTitle} placeholder={t('events.titlePlaceholder')} />
          <TextField label={t('events.descriptionField')} value={description} onChangeText={setDescription} multiline numberOfLines={4} placeholder={t('events.descriptionPlaceholder')} />
          <Text style={{ color: colors.textSecondary, marginBottom: 8, marginTop: 8 }}>{t('events.category')}</Text>
          <View style={styles.chips}>
            {EVENT_CATEGORIES.map((c) => (
              <CategoryChip key={c.id} label={c.label} color={c.color} selected={category === c.id} onPress={() => setCategory(c.id)} />
            ))}
          </View>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <TextField label={t('events.dateField')} value={date} onChangeText={setDate} placeholder="2026-07-15" hint="YYYY-MM-DD" />
          <TextField label={t('events.startTime')} value={startTime} onChangeText={setStartTime} placeholder="18:00" />
          <TextField label={t('events.endTime')} value={endTime} onChangeText={setEndTime} placeholder="21:00" />
          <Text style={{ color: colors.textTertiary, fontSize: 12 * layout.fontScale, marginTop: 8 }}>{t('events.repeatNote')}</Text>
          <View style={[styles.chips, { marginTop: 12 }]}>
            {REPEAT_OPTIONS.map((r) => (
              <Chip key={r.id} label={r.label} selected={repeat === r.id} onPress={() => setRepeat(r.id)} />
            ))}
          </View>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <TextField label={t('events.locationField')} value={location} onChangeText={setLocation} placeholder={t('events.locationPlaceholder')} />
          <TextField label={t('events.coverImage')} value={image} onChangeText={setImage} placeholder="https://…" />
          <TextField label={t('events.maxParticipants')} value={maxParticipants} onChangeText={setMaxParticipants} placeholder={t('events.optional')} keyboardType="number-pad" />
          <Text style={{ color: colors.textSecondary, marginTop: 12, marginBottom: 8 }}>{t('events.privacy')}</Text>
          <View style={styles.chips}>
            <Chip label={t('events.familyOnly')} selected={privacy === 'family'} onPress={() => setPrivacy('family')} />
            <Chip label={t('events.inviteesOnly')} selected={privacy === 'invitees'} onPress={() => setPrivacy('invitees')} />
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: 12 * layout.fontScale, marginTop: 8 }}>{t('events.reminderNote')}</Text>
        </>
      ) : null}

      {step === 3 ? (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 20 * layout.fontScale }}>{title || t('events.untitled')}</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>{description || t('events.noDescription')}</Text>
          <Text style={{ color: colors.text, marginTop: 12 }}>{date || t('events.dateTbd')} {startTime ? `· ${startTime}` : ''}</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{location || t('events.noLocation')}</Text>
          <CategoryChip label={EVENT_CATEGORIES.find((c) => c.id === category)?.label} color={EVENT_CATEGORIES.find((c) => c.id === category)?.color} />
        </View>
      ) : null}

      {step < STEP_KEYS.length - 1 ? (
        <Button title={t('events.continue')} onPress={() => setStep(step + 1)} size="lg" style={{ marginTop: 16 }} />
      ) : (
        <Button title={t('events.createEvent')} onPress={handleSubmit} loading={loading} size="lg" style={{ marginTop: 16, marginBottom: 32 }} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  steps: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
