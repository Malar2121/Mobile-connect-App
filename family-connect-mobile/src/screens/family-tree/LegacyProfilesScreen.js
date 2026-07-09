import React, { useCallback, useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PageHeader, Screen, SectionTitle } from '../../design-system';
import { useFamilyTreeModuleData } from '../../hooks/useFamilyTreeModuleData';
import { LegacyProfileCard } from '../../components/family-tree';
import { getMemoriesForMember } from '../../utils/familyTreeModuleHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function LegacyProfilesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const focusId = route.params?.memberId ? String(route.params.memberId) : null;
  const { colors, layout, radii } = useTheme();
  const { horizontalPadding } = useResponsive();

  const { legacyProfiles, members, memories } = useFamilyTreeModuleData();

  const profiles = useMemo(() => {
    if (!focusId) return legacyProfiles;
    return legacyProfiles.filter((p) => String(p.memberId) === focusId);
  }, [legacyProfiles, focusId]);

  const openProfile = useCallback(
    (profile) => {
      const root = navigation.getParent()?.getParent();
      root?.navigate('Memories', { screen: 'LegacyMode', params: { memberId: profile.memberId } });
    },
    [navigation],
  );

  return (
    <Screen edges={['top']}>
      <PageHeader title="Legacy profiles" subtitle="Remembrance pages from Phase 5" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 40 }}>
        {profiles.length ? (
          profiles.map((profile) => {
            const member = members.find((m) => String(m._id) === String(profile.memberId));
            const count = getMemoriesForMember(memories, profile.memberId).length;
            return (
              <LegacyProfileCard
                key={profile.memberId}
                profile={profile}
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

        <SectionTitle title="Family contributions" subtitle="Stories preserved together" />
        <Text style={{ color: colors.textTertiary, fontSize: 13 }}>
          TODO: Backend collaborative legacy contributions API. Currently stored locally per device via Legacy Mode.
        </Text>
      </ScrollView>
    </Screen>
  );
}
