import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Button,
  Card,
  PageHeader,
  Screen,
  SectionTitle,
  TextField,
  useToast,
} from '../../design-system';
import { LegacyCard, GalleryGrid } from '../../components/memories';
import { useMemoriesModuleData } from '../../hooks/useMemoriesModuleData';
import {
  getMemoriesForLegacyMember,
  saveLegacyProfiles,
} from '../../utils/memoryModuleHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function LegacyModeScreen() {
  const navigation = useNavigation();
  const toast = useToast();
  const { colors, layout, isDark } = useTheme();
  const { horizontalPadding } = useResponsive();
  const { members, memories, legacyProfiles, setLegacyProfiles, family } = useMemoriesModuleData();

  const [selectedMember, setSelectedMember] = useState(null);
  const [story, setStory] = useState('');
  const [years, setYears] = useState('');
  const [saving, setSaving] = useState(false);

  const profiles = legacyProfiles.length
    ? legacyProfiles
    : members.slice(0, 3).map((m) => ({ memberId: String(m._id), displayName: m.fullName }));

  const handleSave = useCallback(async () => {
    if (!selectedMember || !family?._id) return;
    setSaving(true);
    try {
      const updated = [
        {
          memberId: String(selectedMember._id),
          displayName: selectedMember.fullName,
          story: story.trim(),
          years: years.trim(),
          updatedAt: new Date().toISOString(),
        },
        ...legacyProfiles.filter((p) => p.memberId !== String(selectedMember._id)),
      ];
      await saveLegacyProfiles(family._id, updated);
      setLegacyProfiles(updated);
      toast.success('Remembrance page saved');
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [selectedMember, family?._id, story, years, legacyProfiles, setLegacyProfiles, toast]);

  const activeProfile = selectedMember
    ? profiles.find((p) => p.memberId === String(selectedMember._id))
    : null;
  const legacyMemories = selectedMember
    ? getMemoriesForLegacyMember(memories, selectedMember._id)
    : [];

  return (
    <Screen edges={['top']}>
      <PageHeader title="Legacy Mode" subtitle="Honoring those we love" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 40 }}>
        <LinearGradient
          colors={isDark ? ['#1A1528', '#2D2640'] : ['#FDF4FF', '#FFFFFF']}
          style={{ padding: 20, borderRadius: 20, marginBottom: 20 }}
        >
          <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 20 * layout.fontScale }}>
            Preserve their story forever
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8, lineHeight: 22, fontSize: 14 * layout.fontScale }}>
            Legacy Mode creates beautiful remembrance pages for family members — their photos, stories, and contributions live on for future generations.
          </Text>
          <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 10 }}>
            TODO: Backend memorial profiles API — currently stored locally per family.
          </Text>
        </LinearGradient>

        <SectionTitle title="Remembrance pages" />
        {profiles.map((p) => {
          const member = members.find((m) => String(m._id) === p.memberId);
          const count = getMemoriesForLegacyMember(memories, p.memberId).length;
          return (
            <LegacyCard
              key={p.memberId}
              profile={p}
              member={member}
              memoryCount={count}
              onPress={(_, m) => setSelectedMember(m ?? member)}
            />
          );
        })}

        <SectionTitle title="Create remembrance" style={{ marginTop: 20 }} />
        <Card>
          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Select a family member to honor</Text>
          {members.map((m) => (
            <Button
              key={m._id}
              title={m.fullName}
              variant={selectedMember?._id === m._id ? 'primary' : 'secondary'}
              onPress={() => setSelectedMember(m)}
              style={{ marginBottom: 8 }}
            />
          ))}
          {selectedMember ? (
            <>
              <TextField label="Years (e.g. 1945 – 2024)" value={years} onChangeText={setYears} />
              <TextField label="Their story" value={story} onChangeText={setStory} multiline numberOfLines={5} placeholder="A few words about their life and legacy…" />
              <Button title="Save remembrance" onPress={handleSave} loading={saving} style={{ marginTop: 12 }} />
            </>
          ) : null}
        </Card>

        {selectedMember ? (
          <>
            <SectionTitle title={`${selectedMember.fullName}'s memories`} style={{ marginTop: 20 }} />
            {legacyMemories.length === 0 ? (
              <Text style={{ color: colors.textSecondary }}>Tag this member in memories to build their archive.</Text>
            ) : (
              <GalleryGrid
                memories={legacyMemories}
                onPress={(m) => navigation.navigate('MemoryDetails', { id: String(m._id) })}
              />
            )}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
