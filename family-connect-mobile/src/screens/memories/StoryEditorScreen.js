import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Button, Chip, Loader, PageHeader, Screen, TextField, useToast } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';
import {
  STORY_CATEGORIES,
  STORY_LIMITS,
  createStory,
  getStory,
  updateStory,
} from '../../services/archiveService';

/** Write a new family story, or edit one (route param `id`). */
export default function StoryEditorScreen({ route, navigation }) {
  const storyId = route.params?.id;
  const { t } = useI18n();
  const toast = useToast();
  const { colors, layout } = useTheme();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('story');
  const [loading, setLoading] = useState(Boolean(storyId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!storyId) return undefined;
    let alive = true;
    getStory(storyId)
      .then((story) => {
        if (!alive) return;
        setTitle(story.title ?? '');
        setBody(story.body ?? '');
        setCategory(story.category || 'story');
      })
      .catch(() => {
        if (alive) setError(t('stories.notFound'));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [storyId, t]);

  function validate() {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (!cleanTitle) return t('stories.titleRequired');
    if (cleanTitle.length > STORY_LIMITS.title) return t('stories.titleTooLong');
    if (!cleanBody) return t('stories.bodyRequired');
    if (cleanBody.length > STORY_LIMITS.body) return t('stories.bodyTooLong');
    return '';
  }

  async function save() {
    const problem = validate();
    setError(problem);
    if (problem) return;

    setSaving(true);
    const payload = { title: title.trim(), body: body.trim(), category };
    try {
      if (storyId) {
        await updateStory(storyId, payload);
        toast.success(t('stories.saved'));
      } else {
        await createStory(payload);
        toast.success(t('stories.shared'));
      }
      navigation.goBack();
    } catch {
      setError(t('stories.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader fullScreen />;

  return (
    <Screen edges={['top']}>
      <PageHeader title={storyId ? t('stories.edit') : t('stories.new')} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
          <TextField
            label={t('stories.titleLabel')}
            value={title}
            onChangeText={setTitle}
            placeholder={t('stories.titlePlaceholder')}
            maxLength={STORY_LIMITS.title}
          />

          <Text
            style={{
              color: colors.textSecondary,
              fontFamily: 'Inter_600SemiBold',
              fontSize: 13 * layout.fontScale,
              marginTop: 12,
              marginBottom: 8,
            }}
          >
            {t('stories.categoryLabel')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {STORY_CATEGORIES.map((key) => (
              <Chip
                key={key}
                label={t(`stories.categories.${key}`)}
                selected={category === key}
                onPress={() => setCategory(key)}
              />
            ))}
          </View>

          <TextField
            label={t('stories.bodyLabel')}
            value={body}
            onChangeText={setBody}
            placeholder={t('stories.bodyPlaceholder')}
            multiline
            numberOfLines={10}
            maxLength={STORY_LIMITS.body}
            style={{ minHeight: 200, textAlignVertical: 'top' }}
          />
          <Text style={{ color: colors.textTertiary, fontSize: 12 * layout.fontScale, textAlign: 'right', marginTop: 4 }}>
            {body.length}/{STORY_LIMITS.body}
          </Text>

          {error ? (
            <Text style={{ color: colors.error, marginTop: 8, fontSize: 14 * layout.fontScale }} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}

          <Button title={t('common.save')} onPress={save} loading={saving} style={{ marginTop: 16 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
