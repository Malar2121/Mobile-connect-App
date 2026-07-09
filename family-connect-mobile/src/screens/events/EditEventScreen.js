import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Button, PageHeader, Screen, TextField, useToast } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { getEventDetails, updateEvent } from '../../services/eventService';
import { loadEventMeta, saveEventMeta } from '../../utils/eventModuleHelpers';

export default function EditEventScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const toast = useToast();
  const { colors } = useTheme();
  const { id } = route.params ?? {};

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    getEventDetails(id).then((ev) => {
      setTitle(ev.title ?? '');
      setDescription(ev.description ?? '');
      setDate(ev.date ? new Date(ev.date).toISOString().slice(0, 10) : '');
      setStartTime(ev.startTime ?? '');
      setEndTime(ev.endTime ?? '');
      setLocation(ev.location ?? '');
      setImage(ev.image ?? '');
    });
  }, [id]);

  const handleSave = useCallback(async () => {
    setLoading(true);
    try {
      let datePayload;
      if (date.trim()) {
        const parsed = new Date(date.trim());
        if (!Number.isNaN(parsed.getTime())) datePayload = parsed.toISOString();
      }
      await updateEvent(id, {
        title: title.trim(),
        description: description.trim() || undefined,
        date: datePayload,
        startTime: startTime.trim() || undefined,
        endTime: endTime.trim() || undefined,
        location: location.trim() || undefined,
        image: image.trim() || undefined,
      });
      const meta = await loadEventMeta(id);
      await saveEventMeta(id, meta);
      toast.success('Event updated');
      navigation.goBack();
    } catch (e) {
      toast.error(e.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  }, [id, title, description, date, startTime, endTime, location, image, navigation, toast]);

  return (
    <Screen edges={['top']} scroll>
      <PageHeader title="Edit event" onBack={() => navigation.goBack()} />
      <TextField label="Title" value={title} onChangeText={setTitle} />
      <TextField label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={4} />
      <TextField label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
      <TextField label="Start time" value={startTime} onChangeText={setStartTime} />
      <TextField label="End time" value={endTime} onChangeText={setEndTime} />
      <TextField label="Location" value={location} onChangeText={setLocation} />
      <TextField label="Cover image URL" value={image} onChangeText={setImage} />
      <Button title="Save changes" onPress={handleSave} loading={loading} size="lg" style={{ marginTop: 16, marginBottom: 32 }} />
    </Screen>
  );
}
