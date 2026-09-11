import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Button, PageHeader, Screen, TextField, useToast, useDialog } from '../../design-system';
import { PollCard } from '../../components/events';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';
import { createPoll, getPoll, getPollByEvent, castPollVote, closePoll } from '../../services/pollService';
import { useResponsive } from '../../design-system';

export default function EventPollScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const toast = useToast();
  const dialog = useDialog();
  const { colors, layout } = useTheme();
  const { t } = useI18n();
  const { horizontalPadding } = useResponsive();
  const { eventId, pollId: initialPollId } = route.params ?? {};

  const [pollData, setPollData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [question, setQuestion] = useState(() => t('events.pollDefaultQuestion'));
  const [option1, setOption1] = useState('');
  const [option2, setOption2] = useState('');
  const [label1, setLabel1] = useState(() => t('events.pollOptionA'));
  const [label2, setLabel2] = useState(() => t('events.pollOptionB'));

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
      toast.success(t('poll.voteRecorded'));
    } catch (e) {
      toast.error(e.message || t('events.voteFailed'));
    } finally {
      setVoting(false);
    }
  }, [pollData, toast]);

  const handleCreate = useCallback(async () => {
    if (!eventId || !option1 || !option2) {
      toast.error(t('poll.needTwoOptions'));
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
      toast.success(t('poll.created'));
    } catch (e) {
      toast.error(e.message || t('events.couldNotCreatePoll'));
    } finally {
      setCreating(false);
    }
  }, [eventId, question, option1, option2, label1, label2, toast]);

  const handleClose = useCallback(async () => {
    if (!pollData?.poll) return;
    // Use the server's ranked suggestion so the dialog and the card agree.
    const winner = pollData.suggestion ?? null;
    const ok = await dialog.confirm({
      title: t('events.closePoll'),
      message: winner ? t('events.selectWinningSlotLabel', { label: winner.label }) : t('events.closeThisPoll'),
      confirmLabel: t('common.close'),
    });
    if (!ok) return;
    try {
      await closePoll(pollData.poll._id, winner?.optionId);
      await loadPoll();
      toast.success(t('poll.closed'));
    } catch (e) {
      toast.error(e.message || t('events.couldNotClosePoll'));
    }
  }, [pollData, dialog, loadPoll, toast]);

  return (
    <Screen edges={['top']}>
      <PageHeader title={t('poll.title')} subtitle={t('poll.subtitle')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {loading ? (
          <Text style={{ color: colors.textSecondary }}>{t('events.loadingPoll')}</Text>
        ) : pollData ? (
          <PollCard
            poll={pollData.poll}
            results={pollData.results}
            suggestion={pollData.suggestion}
            suggestionReason={pollData.suggestionReason}
            onVote={handleVote}
            onClose={handleClose}
            canManage
            voting={voting}
          />
        ) : (
          <>
            <Text style={{ color: colors.textSecondary, marginBottom: 16, fontSize: 14 * layout.fontScale }}>
              {t('poll.explain')}
            </Text>
            <TextField label={t('poll.question')} value={question} onChangeText={setQuestion} />
            <TextField label={t('poll.optionALabel')} value={label1} onChangeText={setLabel1} />
            <TextField label={t('poll.optionADate')} value={option1} onChangeText={setOption1} placeholder="2026-07-15T18:00" hint={t('poll.dateHint')} />
            <TextField label={t('poll.optionBLabel')} value={label2} onChangeText={setLabel2} />
            <TextField label={t('poll.optionBDate')} value={option2} onChangeText={setOption2} placeholder="2026-07-16T18:00" />
            <Button title={t('poll.createPoll')} onPress={handleCreate} loading={creating} style={{ marginTop: 16 }} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({});
