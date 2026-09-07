import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  Screen,
  SectionTitle,
  TextField,
  useDialog,
  useToast,
} from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { useFamily } from '../../contexts/FamilyContext';
import { useI18n } from '../../i18n';
import {
  createCelebration,
  deleteCelebration,
  getCelebrations,
} from '../../services/celebrationService';

const TYPES = [
  { id: 'anniversary', icon: 'heart', labelKey: 'celebrations.anniversary' },
  { id: 'cultural', icon: 'sparkles', labelKey: 'celebrations.cultural' },
  { id: 'other', icon: 'calendar', labelKey: 'celebrations.other' },
];

const TYPE_META = {
  birthday: { icon: 'gift', color: '#F59E0B' },
  anniversary: { icon: 'heart', color: '#EC4899' },
  cultural: { icon: 'sparkles', color: '#8B5CF6' },
  other: { icon: 'calendar', color: '#0EA5E9' },
};

export default function CelebrationsScreen() {
  const navigation = useNavigation();
  const { colors, layout, radii } = useTheme();
  const { family } = useFamily();
  const { t } = useI18n();
  const toast = useToast();
  const dialog = useDialog();

  const [celebrations, setCelebrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState('anniversary');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    if (!family) {
      setCelebrations([]);
      setLoading(false);
      return;
    }
    setError('');
    try {
      setCelebrations(await getCelebrations());
    } catch (e) {
      setError(e.message || t('celebrations.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [family, t]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleCreate = useCallback(async () => {
    setFormError('');
    if (!title.trim()) {
      setFormError(t('celebrations.titleRequired'));
      return;
    }
    const parsed = new Date(date);
    if (!date || Number.isNaN(parsed.getTime())) {
      setFormError(t('celebrations.dateInvalid'));
      return;
    }

    setSaving(true);
    try {
      await createCelebration({
        type,
        title: title.trim(),
        date: parsed.toISOString(),
        reminderDaysBefore: [1],
      });
      toast.success(t('celebrations.created'));
      setTitle('');
      setDate('');
      setShowForm(false);
      await load();
    } catch (e) {
      setFormError(e.message || t('celebrations.createFailed'));
    } finally {
      setSaving(false);
    }
  }, [type, title, date, toast, load, t]);

  const handleDelete = useCallback(
    async (item) => {
      const ok = await dialog.confirm({
        title: t('celebrations.deleteTitle'),
        message: t('celebrations.deleteMessage', { title: item.title }),
        confirmLabel: t('common.delete'),
        destructive: true,
      });
      if (!ok) return;
      try {
        await deleteCelebration(item._id);
        toast.success(t('celebrations.deleted'));
        await load();
      } catch (e) {
        toast.error(e.message || t('celebrations.deleteFailed'));
      }
    },
    [dialog, toast, load, t],
  );

  const countdownLabel = useCallback(
    (days) => {
      if (days === 0) return t('celebrations.today');
      if (days === 1) return t('celebrations.tomorrow');
      return t('celebrations.inDays', { count: days });
    },
    [t],
  );

  const grouped = useMemo(() => {
    const soon = celebrations.filter((c) => c.daysUntil <= 30);
    const later = celebrations.filter((c) => c.daysUntil > 30);
    return { soon, later };
  }, [celebrations]);

  const renderItem = useCallback(
    ({ item }) => {
      const meta = TYPE_META[item.type] ?? TYPE_META.other;
      const when = item.nextOccurrence ? new Date(item.nextOccurrence) : null;
      return (
        <Card style={{ marginBottom: 10 }}>
          <View style={styles.row}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: `${meta.color}22`, borderRadius: radii.full },
              ]}
            >
              <Ionicons name={meta.icon} size={20} color={meta.color} />
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 15 * layout.fontScale,
                }}
                numberOfLines={2}
              >
                {item.title}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 12.5 * layout.fontScale,
                  marginTop: 3,
                }}
              >
                {when ? when.toDateString() : '—'} · {countdownLabel(item.daysUntil)}
                {item.turningAge ? ` · ${t('celebrations.turning', { age: item.turningAge })}` : ''}
                {item.yearsRunning ? ` · ${t('celebrations.years', { count: item.yearsRunning })}` : ''}
              </Text>
            </View>

            {/* Birthdays are derived from member profiles, so they are edited
                on the member's profile rather than deleted here. */}
            {item.virtual ? (
              <Ionicons name="person-circle-outline" size={20} color={colors.textTertiary} />
            ) : (
              <Pressable
                onPress={() => handleDelete(item)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={t('celebrations.deleteA11y', { title: item.title })}
              >
                <Ionicons name="trash-outline" size={19} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>
        </Card>
      );
    },
    [colors, layout, radii, countdownLabel, handleDelete, t],
  );

  if (!family) {
    return (
      <Screen edges={['top']}>
        <PageHeader title={t('celebrations.title')} onBack={() => navigation.goBack()} />
        <EmptyState
          icon="people-outline"
          title={t('celebrations.noFamilyTitle')}
          description={t('celebrations.noFamilyBody')}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <PageHeader
        title={t('celebrations.title')}
        subtitle={t('celebrations.subtitle')}
        onBack={() => navigation.goBack()}
      />

      {error ? (
        <Card style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.error, fontSize: 14 * layout.fontScale }}>{error}</Text>
          <Button title={t('common.retry')} variant="secondary" onPress={load} style={{ marginTop: 10 }} />
        </Card>
      ) : null}

      <Button
        title={showForm ? t('common.cancel') : t('celebrations.add')}
        variant={showForm ? 'ghost' : 'primary'}
        onPress={() => {
          setShowForm((v) => !v);
          setFormError('');
        }}
        style={{ marginBottom: 12 }}
      />

      {showForm ? (
        <Card style={{ marginBottom: 16 }}>
          {formError ? (
            <Text style={{ color: colors.error, marginBottom: 10, fontSize: 13.5 * layout.fontScale }}>
              {formError}
            </Text>
          ) : null}

          <Text style={{ color: colors.textSecondary, fontSize: 12.5 * layout.fontScale, marginBottom: 8 }}>
            {t('celebrations.typeLabel')}
          </Text>
          <View style={styles.typeRow}>
            {TYPES.map((opt) => {
              const active = type === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setType(opt.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.typeChip,
                    {
                      borderRadius: radii.full,
                      backgroundColor: active ? colors.primary : colors.surfaceSecondary,
                      minHeight: layout.minTouch,
                    },
                  ]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={15}
                    color={active ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text
                    style={{
                      color: active ? '#FFFFFF' : colors.textSecondary,
                      fontSize: 13 * layout.fontScale,
                      marginLeft: 6,
                      fontFamily: 'Inter_600SemiBold',
                    }}
                  >
                    {t(opt.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextField
            label={t('celebrations.titleField')}
            value={title}
            onChangeText={setTitle}
            placeholder={t('celebrations.titlePlaceholder')}
          />
          <TextField
            label={t('celebrations.dateField')}
            value={date}
            onChangeText={setDate}
            placeholder="2010-06-15"
            hint={t('celebrations.dateHint')}
          />
          <Button
            title={t('celebrations.save')}
            onPress={handleCreate}
            loading={saving}
            style={{ marginTop: 10 }}
          />
        </Card>
      ) : null}

      <FlatList
        data={[...grouped.soon, ...grouped.later]}
        keyExtractor={(item) => String(item._id)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={
          grouped.soon.length > 0 ? (
            <SectionTitle title={t('celebrations.comingUp')} style={{ marginBottom: 8 }} />
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale }}>
              {t('common.loading')}
            </Text>
          ) : (
            <EmptyState
              icon="gift-outline"
              title={t('celebrations.emptyTitle')}
              description={t('celebrations.emptyBody')}
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
