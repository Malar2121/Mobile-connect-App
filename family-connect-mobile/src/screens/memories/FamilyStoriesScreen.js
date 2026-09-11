import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Chip, EmptyState, PageHeader, Screen } from '../../design-system';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';
import { getRecentEventNotes, listStories } from '../../services/archiveService';
import { navigateFromNotification } from '../../navigation/navigationRef';

/**
 * The written side of the memory archive: family stories (Objective 4) and
 * notes from family events (§6.3), beside the photos and videos.
 */
export default function FamilyStoriesScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, layout } = useTheme();
  const { t, localeTag } = useI18n();

  const [tab, setTab] = useState('stories');
  const [stories, setStories] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [storiesError, setStoriesError] = useState('');
  const [notesError, setNotesError] = useState('');

  const isGuest = user?.role === 'guest';

  const load = useCallback(async () => {
    const [storyResult, noteResult] = await Promise.allSettled([listStories(), getRecentEventNotes()]);
    if (storyResult.status === 'fulfilled') {
      setStories(storyResult.value);
      setStoriesError('');
    } else {
      setStoriesError(t('stories.loadFailed'));
    }
    if (noteResult.status === 'fulfilled') {
      setNotes(noteResult.value);
      setNotesError('');
    } else {
      setNotesError(t('stories.notesLoadFailed'));
    }
    setLoading(false);
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const formatDate = useCallback(
    (value) => (value ? new Date(value).toLocaleDateString(localeTag, { day: 'numeric', month: 'short', year: 'numeric' }) : ''),
    [localeTag],
  );

  const renderStory = useCallback(
    ({ item }) => (
      <Card style={{ marginBottom: 12 }}>
        <Pressable
          onPress={() => navigation.navigate('StoryDetails', { id: String(item._id) })}
          accessibilityRole="button"
          accessibilityLabel={item.title}
        >
          <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 12 * layout.fontScale }}>
            {t(`stories.categories.${item.category || 'story'}`)}
          </Text>
          <Text
            style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 16 * layout.fontScale, marginTop: 4 }}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text
            style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginTop: 6, lineHeight: 21 * layout.fontScale }}
            numberOfLines={3}
          >
            {item.body}
          </Text>
          <Text style={{ color: colors.textTertiary, fontSize: 12 * layout.fontScale, marginTop: 8 }}>
            {t('stories.byAuthor', { name: item.author?.fullName ?? '' })} · {formatDate(item.createdAt)}
          </Text>
        </Pressable>
      </Card>
    ),
    [colors, layout, navigation, formatDate, t],
  );

  const renderNote = useCallback(
    ({ item }) => (
      <Card style={{ marginBottom: 12 }}>
        <Pressable
          onPress={() => navigateFromNotification({ type: 'event_created', data: { eventId: item.event?._id } })}
          accessibilityRole="button"
          accessibilityLabel={t('stories.onEvent', { title: item.event?.title ?? '' })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text
              style={{ flex: 1, color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 13 * layout.fontScale }}
              numberOfLines={1}
            >
              {t('stories.onEvent', { title: item.event?.title ?? '' })}
            </Text>
          </View>
          <Text style={{ color: colors.text, fontSize: 15 * layout.fontScale, marginTop: 6, lineHeight: 22 * layout.fontScale }}>
            {item.content}
          </Text>
          <Text style={{ color: colors.textTertiary, fontSize: 12 * layout.fontScale, marginTop: 8 }}>
            {t('stories.byAuthor', { name: item.author?.fullName ?? '' })} · {formatDate(item.createdAt)}
          </Text>
        </Pressable>
      </Card>
    ),
    [colors, layout, formatDate, t],
  );

  const showingStories = tab === 'stories';
  const error = showingStories ? storiesError : notesError;

  const header = (
    <View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <Chip label={t('stories.tabStories')} selected={showingStories} onPress={() => setTab('stories')} />
        <Chip label={t('stories.tabNotes')} selected={!showingStories} onPress={() => setTab('notes')} />
      </View>

      {showingStories && !isGuest ? (
        <Button title={t('stories.share')} onPress={() => navigation.navigate('StoryEditor')} style={{ marginBottom: 12 }} />
      ) : null}
      {showingStories && isGuest ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale, marginBottom: 12 }}>
          {t('stories.readOnlyGuest')}
        </Text>
      ) : null}

      {error ? (
        <Card style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.error, fontSize: 14 * layout.fontScale }}>{error}</Text>
          <Button title={t('common.retry')} variant="secondary" onPress={load} style={{ marginTop: 10 }} />
        </Card>
      ) : null}
    </View>
  );

  const empty = loading ? (
    <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale }}>{t('common.loading')}</Text>
  ) : error ? null : showingStories ? (
    <EmptyState icon="book-outline" title={t('stories.emptyTitle')} description={t('stories.emptyBody')} />
  ) : (
    <EmptyState icon="document-text-outline" title={t('stories.notesEmptyTitle')} description={t('stories.notesEmptyBody')} />
  );

  return (
    <Screen edges={['top']}>
      <PageHeader title={t('stories.title')} subtitle={t('stories.subtitle')} onBack={() => navigation.goBack()} />
      <FlatList
        data={showingStories ? stories : notes}
        keyExtractor={(item) => String(item._id)}
        renderItem={showingStories ? renderStory : renderNote}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </Screen>
  );
}
