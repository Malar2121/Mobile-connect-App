import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Button,
  Card,
  EmptyState,
  Loader,
  PageHeader,
  Screen,
  useDialog,
  useToast,
} from '../../design-system';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';
import { deleteStory, getStory } from '../../services/archiveService';

/** Read one family story; its author or an admin can edit or delete it. */
export default function StoryDetailsScreen({ route, navigation }) {
  const { id } = route.params ?? {};
  const { user } = useAuth();
  const { t, localeTag } = useI18n();
  const { colors, layout } = useTheme();
  const toast = useToast();
  const dialog = useDialog();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      setStory(await getStory(id));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Reload on focus so returning from the editor shows the saved text.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const remove = useCallback(async () => {
    const ok = await dialog.confirm({
      title: t('stories.deleteTitle'),
      message: t('stories.deleteMessage'),
      confirmLabel: t('common.delete'),
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteStory(id);
      toast.success(t('stories.deleted'));
      navigation.goBack();
    } catch {
      toast.error(t('stories.deleteFailed'));
    }
  }, [dialog, id, navigation, toast, t]);

  if (loading) return <Loader fullScreen />;

  if (failed || !story) {
    return (
      <Screen edges={['top']}>
        <PageHeader title={t('stories.title')} onBack={() => navigation.goBack()} />
        <EmptyState icon="book-outline" title={t('stories.notFound')} />
        <Button
          title={t('common.retry')}
          variant="secondary"
          onPress={() => {
            setLoading(true);
            load();
          }}
          style={{ marginTop: 12 }}
        />
      </Screen>
    );
  }

  const authorId = String(story.author?._id ?? story.author ?? '');
  const canEdit = Boolean(user) && (user.role === 'admin' || authorId === String(user._id));
  const date = new Date(story.createdAt).toLocaleDateString(localeTag, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Screen edges={['top']}>
      <PageHeader title={t(`stories.categories.${story.category || 'story'}`)} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text
          style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 22 * layout.fontScale, lineHeight: 30 * layout.fontScale }}
        >
          {story.title}
        </Text>
        <Text style={{ color: colors.textTertiary, fontSize: 13 * layout.fontScale, marginTop: 6 }}>
          {t('stories.byAuthor', { name: story.author?.fullName ?? '' })} · {date}
        </Text>
        {story.event?.title ? (
          <Text style={{ color: colors.primary, fontSize: 13 * layout.fontScale, marginTop: 4 }}>
            {t('stories.onEvent', { title: story.event.title })}
          </Text>
        ) : null}

        <Card style={{ marginTop: 16 }}>
          <Text style={{ color: colors.text, fontSize: 16 * layout.fontScale, lineHeight: 26 * layout.fontScale }} selectable>
            {story.body}
          </Text>
        </Card>

        {canEdit ? (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <Button
              title={t('common.edit')}
              variant="secondary"
              onPress={() => navigation.navigate('StoryEditor', { id })}
              style={{ flex: 1 }}
            />
            <Button title={t('common.delete')} variant="danger" onPress={remove} style={{ flex: 1 }} />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
