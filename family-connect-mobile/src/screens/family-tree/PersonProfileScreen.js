import React, { useCallback, useMemo } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader, Screen, SectionTitle, Loader } from '../../design-system';
import { useFamilyTreeModuleData } from '../../hooks/useFamilyTreeModuleData';
import { PersonCard, HeritageCard } from '../../components/family-tree';
import { getMemoriesForMember, getEventsForMember } from '../../utils/familyTreeModuleHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

function RelationSection({ title, people, onPress }) {
  if (!people?.length) return null;
  return (
    <>
      <SectionTitle title={title} />
      {people.map((p) => (
        <PersonCard key={p.id} person={p} onPress={onPress} compact />
      ))}
    </>
  );
}

export default function PersonProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const memberId = String(route.params?.memberId ?? '');
  const { colors, layout, radii } = useTheme();
  const { horizontalPadding } = useResponsive();

  const { enrichedNodes, memories, events, achievements, legacyProfiles, loading, getPersonRelations } =
    useFamilyTreeModuleData();

  const relations = useMemo(() => getPersonRelations(memberId), [getPersonRelations, memberId]);
  const person = relations.node;
  const personMemories = useMemo(() => getMemoriesForMember(memories, memberId), [memories, memberId]);
  const personEvents = useMemo(() => getEventsForMember(events, memberId), [events, memberId]);
  const personAchievements = useMemo(
    () => (achievements ?? []).filter((a) => String(a.memberId) === memberId),
    [achievements, memberId],
  );
  const legacy = legacyProfiles.find((p) => String(p.memberId) === memberId);

  const openPerson = useCallback((p) => navigation.push('PersonProfile', { memberId: String(p.id) }), [navigation]);

  if (loading && !person) {
    return (
      <Screen edges={['top']}>
        <PageHeader title="Profile" onBack={() => navigation.goBack()} />
        <Loader />
      </Screen>
    );
  }

  if (!person) {
    return (
      <Screen edges={['top']}>
        <PageHeader title="Profile" onBack={() => navigation.goBack()} />
        <Text style={{ color: colors.textSecondary, padding: horizontalPadding }}>Member not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} style={{ paddingHorizontal: 0 }}>
      <View style={{ paddingHorizontal: horizontalPadding }}>
        <PageHeader title={person.name} subtitle={person.relationshipLabel} onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 40 }}>
        <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii['2xl'] }]}>
          <PersonCard person={person} subtitle={`Role: ${person.role ?? 'member'}`} />
          <View style={styles.metaRow}>
            <MetaChip icon="calendar-outline" label="Birth" value={person.dateOfBirth ? new Date(person.dateOfBirth).toLocaleDateString() : 'Not recorded'} colors={colors} layout={layout} />
            <MetaChip icon="pulse-outline" label="Status" value={legacy ? 'Remembered' : 'Living'} colors={colors} layout={layout} />
          </View>
          {legacy ? (
            <View style={[styles.legacyBadge, { backgroundColor: colors.primarySubtle, borderRadius: radii.full }]}>
              <Ionicons name="heart" size={14} color={colors.primary} />
              <Text style={{ color: colors.primary, marginLeft: 6, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>Memorial profile</Text>
            </View>
          ) : null}
        </View>

        <RelationSection title="Parents" people={relations.parents} onPress={openPerson} />
        <RelationSection title="Partner" people={relations.partner} onPress={openPerson} />
        <RelationSection title="Siblings" people={relations.siblings} onPress={openPerson} />
        <RelationSection title="Children" people={relations.children} onPress={openPerson} />

        {personEvents.length ? (
          <>
            <SectionTitle title="Events attended" />
            {personEvents.slice(0, 5).map((e) => (
              <HeritageCard key={e._id} item={{ id: e._id, type: 'event', title: e.title, date: e.date, icon: 'calendar-outline' }} />
            ))}
          </>
        ) : null}

        {personMemories.length ? (
          <>
            <SectionTitle title="Memories" subtitle={`${personMemories.length} preserved`} />
            <FlatList
              data={personMemories.slice(0, 6)}
              horizontal
              keyExtractor={(m) => String(m._id)}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <HeritageCard
                  item={{ id: item._id, type: 'memory', title: item.caption || 'Memory', date: item.createdAt, icon: 'images-outline' }}
                />
              )}
            />
          </>
        ) : null}

        {personAchievements.length ? (
          <>
            <SectionTitle title="Achievements" />
            {personAchievements.map((a) => (
              <HeritageCard key={a.id} item={{ id: a.id, type: 'achievement', title: a.title, body: a.description, date: a.date, icon: 'trophy-outline' }} />
            ))}
          </>
        ) : null}

        <SectionTitle title="Timeline" subtitle="Life events architecture" style={{ marginTop: 20 }} />
        {person.lifeEvents && person.lifeEvents.length > 0 ? (
          person.lifeEvents.map((evt, i) => (
            <Card key={evt._id || i} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="calendar" size={16} color={colors.primary} />
                <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }}>{evt.title}</Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                {new Date(evt.date).toLocaleDateString()} - {evt.type}
              </Text>
              {evt.description ? (
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>{evt.description}</Text>
              ) : null}
            </Card>
          ))
        ) : (
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 16 }}>
            No life events recorded yet.
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}

function MetaChip({ icon, label, value, colors, layout }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Ionicons name={icon} size={14} color={colors.textTertiary} />
        <Text style={{ color: colors.textTertiary, fontSize: 11 * layout.fontScale }}>{label}</Text>
      </View>
      <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13 * layout.fontScale, marginTop: 4 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 16, borderWidth: 1, marginBottom: 16 },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  legacyBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, marginTop: 12 },
});
