import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Button,
  Card,
  PageHeader,
  Screen,
  SectionTitle,
  TextField,
  useToast,
  Loader,
} from '../../design-system';
import { LegacyCard, GalleryGrid } from '../../components/memories';
import { useMemoriesModuleData } from '../../hooks/useMemoriesModuleData';
import { getMemoriesForLegacyMember } from '../../utils/memoryModuleHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';
import { getLegacyProfiles, createLegacyProfile } from '../../services/legacyService';
import { useAuth } from '../../contexts/AuthContext';

export default function LegacyModeScreen() {
  const navigation = useNavigation();
  const toast = useToast();
  const { colors, layout, isDark } = useTheme();
  const { horizontalPadding } = useResponsive();
  const { members, memories, family } = useMemoriesModuleData();
  const { user } = useAuth();

  const [profiles, setProfiles] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [biography, setBiography] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [burialLocation, setBurialLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfiles = useCallback(async () => {
    try {
      const data = await getLegacyProfiles();
      setProfiles(data);
    } catch (error) {
      // Don't toast error here, just silently fail to empty list
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadProfiles(); }, [loadProfiles]));

  const handleSave = useCallback(async () => {
    if (!selectedMember || !family?._id) return;
    setSaving(true);
    try {
      const created = await createLegacyProfile({
        memberId: selectedMember._id,
        biography: biography.trim(),
        deathDate: deathDate.trim() ? new Date(deathDate.trim()).toISOString() : undefined,
        burialLocation: burialLocation.trim(),
      });
      setProfiles((prev) => [created, ...prev]);
      toast.success('Remembrance page saved');
      setBiography('');
      setDeathDate('');
      setBurialLocation('');
      setSelectedMember(null);
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [selectedMember, family?._id, biography, deathDate, burialLocation, toast]);

  const activeProfile = selectedMember
    ? profiles.find((p) => p.memberId === String(selectedMember._id) || p.memberId?._id === String(selectedMember._id))
    : null;
  const legacyMemories = selectedMember
    ? getMemoriesForLegacyMember(memories, selectedMember._id)
    : [];

  if (loading) return <Loader fullScreen />;

  return (
    <Screen edges={['top']}>
      <PageHeader title="Legacy Mode" subtitle="Honoring those we love" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
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
        </LinearGradient>

        <SectionTitle title="Remembrance pages" />
        {profiles.length > 0 ? (
          profiles.map((p) => {
            const memberId = p.memberId?._id || p.memberId;
            const member = members.find((m) => String(m._id) === String(memberId)) || p.memberId;
            const count = getMemoriesForLegacyMember(memories, memberId).length;
            return (
              <LegacyCard
                key={String(p._id)}
                profile={{ ...p, story: p.biography, years: p.deathDate ? new Date(p.deathDate).getFullYear().toString() : 'Unknown' }}
                member={member}
                memoryCount={count}
                onPress={(_, m) => setSelectedMember(m ?? member)}
              />
            );
          })
        ) : (
          <Text style={{ color: colors.textSecondary }}>No legacy profiles found.</Text>
        )}

        {user?.role === 'admin' ? (
          <>
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
              {selectedMember && !profiles.some(p => String(p.memberId?._id || p.memberId) === String(selectedMember._id)) ? (
                <>
                  <TextField label="Date of Death (YYYY-MM-DD)" value={deathDate} onChangeText={setDeathDate} />
                  <TextField label="Burial Location" value={burialLocation} onChangeText={setBurialLocation} />
                  <TextField label="Biography" value={biography} onChangeText={setBiography} multiline numberOfLines={5} placeholder="A few words about their life and legacy…" />
                  <Button title="Save remembrance" onPress={handleSave} loading={saving} style={{ marginTop: 12 }} />
                </>
              ) : selectedMember ? (
                <Text style={{ color: colors.textTertiary, marginTop: 8 }}>This member already has a legacy profile.</Text>
              ) : null}
            </Card>
          </>
        ) : null}

        {selectedMember ? (
          <>
            <SectionTitle title={`${selectedMember.fullName || selectedMember.displayName}'s memories`} style={{ marginTop: 20 }} />
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
