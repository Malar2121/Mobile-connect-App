import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Linking, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Loader,
  PageHeader,
  Screen,
  SectionTitle,
  useToast,
  useDialog,
} from '../../design-system';
import {
  EventHeroCard,
  RSVPCard,
  PollCard,
  EventGallery,
} from '../../components/events';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { getEventDetails, respondToEvent, deleteEvent, getEventComments, addEventComment } from '../../services/eventService';
import { getPollByEvent } from '../../services/pollService';
import { getFamilyMemories } from '../../services/memoryService';
import { formatEventDateLong, getMyRsvpStatus } from '../../utils/eventFormat';
import { getEventCountdown, isEventPast } from '../../utils/eventModuleHelpers';
import { useResponsive } from '../../design-system';
import { useI18n } from '../../i18n';

export default function EventDetailsScreen({ route, navigation }) {
  const { id } = route.params ?? {};
  const { colors, layout, radii } = useTheme();

  const { t } = useI18n();
  const { horizontalPadding } = useResponsive();
  const toast = useToast();
  const dialog = useDialog();
  const { user } = useAuth();
  const userId = user?._id;

  const [event, setEvent] = useState(null);
  const [pollData, setPollData] = useState(null);
  const [memories, setMemories] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getEventDetails(id);
      setEvent(data);
      try {
        const poll = await getPollByEvent(id);
        setPollData(poll);
      } catch {
        setPollData(null);
      }
      try {
        const c = await getEventComments(id);
        setComments(c);
      } catch {
        setComments([]);
      }
      try {
        const mem = await getFamilyMemories();
        const title = (data.title ?? '').toLowerCase();
        setMemories(
          mem.filter((m) => (m.caption ?? '').toLowerCase().includes(title.slice(0, 6)) || title.includes((m.caption ?? '').toLowerCase().slice(0, 6))),
        );
      } catch {
        setMemories([]);
      }
    } catch (e) {
      toast.error(e.message || t('events.couldNotLoadEvent'));
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const respond = useCallback(async (status) => {
    setSubmitting(status);
    try {
      await respondToEvent(id, status);
      await load();
      toast.success(t('events.rsvpUpdated'));
    } catch (e) {
      toast.error(e.message || t('events.rsvpFailed'));
    } finally {
      setSubmitting(null);
    }
  }, [id, load, toast]);

  const handlePostComment = useCallback(async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const added = await addEventComment(id, newComment);
      setComments((prev) => [...prev, added]);
      setNewComment('');
    } catch (e) {
      toast.error(e.message || t('events.failedToPostComment'));
    } finally {
      setPostingComment(false);
    }
  }, [id, newComment, toast]);

  const handleDelete = useCallback(async () => {
    const ok = await dialog.confirm({ title: t('events.deleteEvent2'), message: t('events.thisCannotBeUndone'), destructive: true, confirmLabel: t('common.delete') });
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteEvent(id);
      toast.success(t('events.deleted'));
      navigation.goBack();
    } catch (e) {
      toast.error(e.message || t('events.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  }, [dialog, id, navigation, toast]);

  const isHost = useMemo(() => {
    if (!event || !userId) return false;
    const cb = event.createdBy?._id ?? event.createdBy;
    return String(cb) === String(userId) || user?.role === 'admin';
  }, [event, userId, user?.role]);

  if (loading) return <Loader fullScreen />;

  if (!event) {
    return (
      <Screen edges={['top']}>
        <PageHeader title={t('events.event')} onBack={() => navigation.goBack()} />
        <EmptyState icon="calendar-outline" title={t('events.notFound')} actionLabel={t('common.back')} onAction={() => navigation.goBack()} />
      </Screen>
    );
  }

  const creatorName = event.createdBy?.fullName ?? t('events.familyMember');
  const myStatus = getMyRsvpStatus(event, userId);
  const countdown = getEventCountdown(event);
  const past = isEventPast(event);
  const mapQuery = event.location ? encodeURIComponent(event.location) : null;

  return (
    <Screen edges={['top']} noPadding>
      <View style={{ paddingHorizontal: horizontalPadding }}>
        <PageHeader title={event.title} onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <EventHeroCard event={event} countdown={!past ? countdown : null} />

        <Card style={{ marginTop: 16 }}>
          {event.description ? (
            <Text style={{ color: colors.textSecondary, fontSize: 15 * layout.fontScale, lineHeight: 22 }}>{event.description}</Text>
          ) : (
            <Text style={{ color: colors.textTertiary, fontStyle: 'italic' }}>{t('events.noDescription')}</Text>
          )}
        </Card>

        <Card style={{ marginTop: 12 }}>
          <DetailRow icon="calendar-outline" label={t('events.dateField')} value={formatEventDateLong(event.date)} colors={colors} layout={layout} />
          <DetailRow icon="time-outline" label={t('events.time')} value={[event.startTime, event.endTime].filter(Boolean).join(' – ') || null} colors={colors} layout={layout} />
          <DetailRow icon="person-outline" label={t('events.host')} value={creatorName} colors={colors} layout={layout} />
          {event.location ? (
            <DetailRow icon="location-outline" label={t('events.locationField')} value={event.location} colors={colors} layout={layout} />
          ) : null}
        </Card>

        {mapQuery ? (
          <Card style={{ marginTop: 12 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>{t('events.mapPreview')}</Text>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }}>{event.location}</Text>
            <Button title={t('events.openInMaps')} variant="secondary" onPress={() => Linking.openURL(`https://maps.google.com/?q=${mapQuery}`)} style={{ marginTop: 12 }} />
          </Card>
        ) : null}

        <View style={{ marginTop: 16 }}>
          <RSVPCard event={event} />
        </View>

        {!past ? (
          <>
            <SectionTitle title={t('events.yourRsvp')} style={{ marginTop: 20 }} />
            <Badge label={myStatus} variant={myStatus === 'accepted' ? 'success' : myStatus === 'declined' ? 'danger' : 'default'} style={{ marginBottom: 12 }} />
            <Button title={t('events.accept')} onPress={() => respond('accepted')} loading={submitting === 'accepted'} disabled={Boolean(submitting)} />
            <Button title={t('events.maybe')} variant="secondary" onPress={() => respond('maybe')} loading={submitting === 'maybe'} style={{ marginTop: 8 }} disabled={Boolean(submitting)} />
            <Button title={t('events.decline')} variant="outline" onPress={() => respond('declined')} loading={submitting === 'declined'} style={{ marginTop: 8 }} disabled={Boolean(submitting)} />
          </>
        ) : null}

        <SectionTitle title={t('events.availabilityPoll')} subtitle={t('events.pollSubtitle')} style={{ marginTop: 20 }} />
        {pollData ? (
          <PollCard
            poll={pollData.poll}
            results={pollData.results}
            onVote={() => navigation.navigate('EventPoll', { eventId: id, pollId: pollData.poll._id })}
            canManage={isHost}
          />
        ) : (
          <Card>
            <Text style={{ color: colors.textSecondary }}>{t('events.noPoll')}</Text>
            {isHost ? (
              <Button title={t('events.createPoll')} onPress={() => navigation.navigate('EventPoll', { eventId: id })} style={{ marginTop: 12 }} />
            ) : null}
          </Card>
        )}

        <SectionTitle title={t('events.gallery')} style={{ marginTop: 20 }} />
        <EventGallery memories={memories} eventTitle={event.title} />

        <SectionTitle title={t('memories.comments')} subtitle={t('memories.commentCount', { count: comments.length })} style={{ marginTop: 20 }} />
        <View style={{ marginTop: 8 }}>
          {comments.map((c, idx) => (
            <Card key={c._id || idx} style={{ marginBottom: 8, padding: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>{c.author?.fullName}</Text>
                <Text style={{ color: colors.textTertiary, fontSize: 11 }}>{new Date(c.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}>{c.content}</Text>
            </Card>
          ))}
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <TextInput
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radii.md,
                paddingHorizontal: 12,
                color: colors.text,
                fontFamily: 'Inter_400Regular',
              }}
              placeholder={t('events.addNote')}
              placeholderTextColor={colors.textTertiary}
              value={newComment}
              onChangeText={setNewComment}
            />
            <Button title={t('memories.post')} onPress={handlePostComment} loading={postingComment} disabled={!newComment.trim()} style={{ marginLeft: 8 }} />
          </View>
        </View>

        <View style={{ marginTop: 20, gap: 10 }}>
          <Button title={t('events.rsvpManagement')} variant="secondary" onPress={() => navigation.navigate('RSVPManagement', { id })} />
          <Button title={t('events.reminders')} variant="secondary" onPress={() => navigation.navigate('EventReminders', { eventId: id })} />
          <Button title={t('events.attachments')} variant="secondary" onPress={() => navigation.navigate('EventAttachments', { eventId: id })} />
          {isHost ? (
            <>
              <Button title={t('events.editEvent')} variant="secondary" onPress={() => navigation.navigate('EditEvent', { id })} />
              <Button title={t('events.deleteEvent')} variant="danger" onPress={handleDelete} loading={deleting} />
            </>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

function DetailRow({ icon, label, value, colors, layout }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={layout.iconSize - 2} color={colors.primary} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 12 * layout.fontScale }}>{label}</Text>
        <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 15 * layout.fontScale, marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
});
