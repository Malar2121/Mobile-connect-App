import React, { useCallback, useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PageHeader, Screen, SectionTitle } from '../../design-system';
import { useFamilyTreeModuleData } from '../../hooks/useFamilyTreeModuleData';
import { PersonCard } from '../../components/family-tree';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function DescendantsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { colors, layout } = useTheme();
  const { horizontalPadding } = useResponsive();
  const memberId = String(route.params?.memberId ?? user?._id ?? '');

  const { getDescendants } = useFamilyTreeModuleData();
  const lineage = useMemo(() => getDescendants(memberId, 3), [getDescendants, memberId]);

  const openPerson = useCallback((p) => navigation.navigate('PersonProfile', { memberId: String(p.id) }), [navigation]);

  return (
    <Screen edges={['top']}>
      <PageHeader title="Descendants" subtitle="Children & future generations" onBack={() => navigation.goBack()} />

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
            No descendants mapped yet. Connect children and grandchildren in the relationship editor.
          </Text>
        )}

        <View style={{ marginTop: 24, padding: 16, backgroundColor: colors.surfaceSecondary, borderRadius: 16 }}>
          <Text style={{ color: colors.textTertiary, fontSize: 13 * layout.fontScale }}>
            Architecture ready for future generations — extended lineage depth will use the same graph traversal when backend adds multi-hop relationship APIs.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
