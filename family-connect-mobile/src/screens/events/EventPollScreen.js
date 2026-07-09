import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Button, PageHeader, Screen, TextField, useToast, useDialog } from '../../design-system';
import { PollCard } from '../../components/events';
import { useTheme } from '../../hooks/useTheme';
import { createPoll, getPoll, getPollByEvent, castPollVote, closePoll } from '../../services/pollService';
import { useResponsive } from '../../design-system';

export default function EventPollScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const toast = useToast();
  const dialog = useDialog();
  const { colors, layout } = useTheme();
  const { horizontalPadding } = useResponsive();
  const { eventId, pollId: initialPollId } = route.params ?? {};

  const [pollData, setPollData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [question, setQuestion] = useState('When works best for everyone?');
  const [option1, setOption1] = useState('');
  const [option2, setOption2] = useState('');
  const [label1, setLabel1] = useState('Option A');
  const [label2, setLabel2] = useState('Option B');

  const loadPoll = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (initialPollId) data = await getPoll(initialPollId);
      else if (eventId) data = await getPollByEvent(eventId);
      setPollData(data);
    } catch {
      setPollData(null);
    } finally {
      setLoading(false);
    }
  }, [eventId, initialPollId]);

  useEffect(() => { loadPoll(); }, [loadPoll]);

  const handleVote = useCallback(async (optionId, vote) => {
    if (!pollData?.poll?._id) return;
    setVoting(true);
    try {
      await castPollVote(pollData.poll._id, optionId, vote);
      const fresh = await getPoll(pollData.poll._id);
      setPollData(fresh);
      toast.success('Vote recorded');
    } catch (e) {
      toast.error(e.message || 'Vote failed');
    } finally {
      setVoting(false);
    }
  }, [pollData, toast]);

  const handleCreate = useCallback(async () => {
    if (!eventId || !option1 || !option2) {
      toast.error('Add at least two date options');
      return;
    }
    setCreating(true);
    try {
      const data = await createPoll({
        eventId,
        question: question.trim(),
        options: [
          { dateTime: new Date(option1).toISOString(), label: label1 },
          { dateTime: new Date(option2).toISOString(), label: label2 },
        ],
      });
      const fresh = await getPoll(data.poll._id);
      setPollData(fresh);
      toast.success('Poll created');
    } catch (e) {
      toast.error(e.message || 'Could not create poll');
    } finally {
      setCreating(false);
    }
  }, [eventId, question, option1, option2, label1, label2, toast]);

  const handleClose = useCallback(async () => {
    if (!pollData?.poll) return;
    const results = pollData.results ?? [];
    const winner = [...results].sort((a, b) => b.availabilityScore - a.availabilityScore)[0];
    const ok = await dialog.confirm({
      title: 'Close poll?',
      message: winner ? `Select winning slot: ${winner.label}?` : 'Close this poll?',
      confirmLabel: 'Close',
    });
    if (!ok) return;
    try {
      await closePoll(pollData.poll._id, winner?.optionId);
      await loadPoll();
      toast.success('Poll closed');
    } catch (e) {
      toast.error(e.message || 'Could not close poll');
    }
  }, [pollData, dialog, loadPoll, toast]);

  return (
    <Screen edges={['top']}>
      <PageHeader title="Availability poll" subtitle="Doodle-style scheduling" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 32 }}>
        {loading ? (
          <Text style={{ color: colors.textSecondary }}>Loading poll…</Text>
        ) : pollData ? (
          <PollCard
            poll={pollData.poll}
            results={pollData.results}
            onVote={handleVote}
            onClose={handleClose}
            canManage
            voting={voting}
          />
        ) : (
          <>
            <Text style={{ color: colors.textSecondary, marginBottom: 16, fontSize: 14 * layout.fontScale }}>
              Propose multiple dates and let family members vote yes, maybe, or no.
            </Text>
            <TextField label="Question" value={question} onChangeText={setQuestion} />
            <TextField label="Option A label" value={label1} onChangeText={setLabel1} />
            <TextField label="Option A date/time" value={option1} onChangeText={setOption1} placeholder="2026-07-15T18:00" hint="ISO format or parseable date" />
            <TextField label="Option B label" value={label2} onChangeText={setLabel2} />
            <TextField label="Option B date/time" value={option2} onChangeText={setOption2} placeholder="2026-07-16T18:00" />
            <Button title="Create poll" onPress={handleCreate} loading={creating} style={{ marginTop: 16 }} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({});
