import React, { useCallback, useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PageHeader, Screen, SectionTitle } from '../../design-system';
import { useFamilyTreeModuleData } from '../../hooks/useFamilyTreeModuleData';
import { PersonCard } from '../../components/family-tree';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function AncestorsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { colors, layout } = useTheme();
  const { horizontalPadding } = useResponsive();
  const memberId = String(route.params?.memberId ?? user?._id ?? '');

  const { getAncestors, loading } = useFamilyTreeModuleData();
  const lineage = useMemo(() => getAncestors(memberId, 4), [getAncestors, memberId]);

  const openPerson = useCallback((p) => navigation.navigate('PersonProfile', { memberId: String(p.id) }), [navigation]);

  return (
    <Screen edges={['top']}>
      <PageHeader title="Ancestors" subtitle="Visual lineage upward" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 40 }}>
        {lineage.length ? (
          lineage.map((level) => (
            <View key={level.depth} style={{ marginBottom: layout.sectionGap }}>
              <SectionTitle title={level.label} subtitle={`${level.members.length} member(s)`} />
              {level.members.map((p) => (
                <PersonCard key={p.id} person={p} onPress={openPerson} />
              ))}
            </View>
          ))
        ) : (
          <Text style={{ color: colors.textSecondary, fontSize: 15 * layout.fontScale, lineHeight: 22 }}>
            No ancestor relationships mapped yet. Use the relationship editor to connect parents and grandparents.
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}
