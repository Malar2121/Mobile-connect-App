import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { PageHeader, Screen, SectionTitle, Loader } from '../../design-system';
import { useFamilyTreeModuleData } from '../../hooks/useFamilyTreeModuleData';
import { LegacyProfileCard } from '../../components/family-tree';
import { getMemoriesForMember } from '../../utils/familyTreeModuleHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';
import { getLegacyProfiles } from '../../services/legacyService';

export default function LegacyProfilesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const focusId = route.params?.memberId ? String(route.params.memberId) : null;
  const { colors, layout, radii } = useTheme();
  const { horizontalPadding } = useResponsive();

  const { members, memories } = useFamilyTreeModuleData();
  const [legacyProfiles, setLegacyProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProfiles = useCallback(async () => {
    try {
      const data = await getLegacyProfiles();
      setLegacyProfiles(data);
    } catch (error) {
      setLegacyProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadProfiles(); }, [loadProfiles]));

  const profiles = useMemo(() => {
    if (!focusId) return legacyProfiles;
    return legacyProfiles.filter((p) => String(p.memberId?._id || p.memberId) === focusId);
  }, [legacyProfiles, focusId]);

  const openProfile = useCallback(
    (profile) => {
      const root = navigation.getParent()?.getParent();
      root?.navigate('Memories', { screen: 'LegacyMode', params: { memberId: profile.memberId?._id || profile.memberId } });
    },
    [navigation],
  );

  if (loading) return <Loader fullScreen />;

  return (
    <Screen edges={['top']}>
      <PageHeader title="Legacy profiles" subtitle="Remembrance pages" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 40 }}>
        {profiles.length ? (
          profiles.map((profile) => {
            const memberId = profile.memberId?._id || profile.memberId;
            const member = members.find((m) => String(m._id) === String(memberId)) || profile.memberId;
            const count = getMemoriesForMember(memories, memberId).length;
            return (
              <LegacyProfileCard
                key={String(profile._id)}
                profile={{ ...profile, story: profile.biography, years: profile.deathDate ? new Date(profile.deathDate).getFullYear().toString() : 'Unknown' }}
                member={member}
                memoryCount={count}
                onPress={() => openProfile(profile)}
              />
            );
          })
        ) : (
          <View style={{ padding: 20, backgroundColor: colors.surfaceSecondary, borderRadius: radii.xl }}>
            <Text style={{ color: colors.textSecondary, fontSize: 15 * layout.fontScale, lineHeight: 22 }}>
              No legacy profiles yet. Create remembrance pages in Memories → Legacy Mode to honor beloved family members.
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
