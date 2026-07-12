import React, { useMemo } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PageHeader, Screen } from '../../design-system';
import { TaggedMemberCard } from '../../components/memories';
import { useMemoriesModuleData } from '../../hooks/useMemoriesModuleData';
import { getTaggedMemoriesForMember } from '../../utils/memoryModuleHelpers';
import { mapTreeNodeToMember } from '../../utils/familyModuleHelpers';
import { getFamilyTree } from '../../services/familyTreeService';
import { useEffect, useState } from 'react';
import { useResponsive } from '../../design-system';

export default function TaggedMembersScreen() {
  const navigation = useNavigation();
  const { horizontalPadding } = useResponsive();
  const { members, memories } = useMemoriesModuleData();
  const [treeNodes, setTreeNodes] = useState([]);

  useEffect(() => {
    getFamilyTree().then(setTreeNodes).catch(() => setTreeNodes([]));
  }, []);

  const tagged = useMemo(
    () =>
      members
        .map((m) => ({
          member: m,
          count: getTaggedMemoriesForMember(memories, m._id).length,
          relationship: mapTreeNodeToMember(treeNodes, m._id)?.relationshipLabel,
        }))
        .filter((x) => x.count > 0)
        .sort((a, b) => b.count - a.count),
    [members, memories, treeNodes],
  );

  return (
    <Screen edges={['top']}>
      <PageHeader title="Tagged members" subtitle="Who appears in memories" onBack={() => navigation.goBack()} />
      <FlatList
        data={tagged}
        keyExtractor={(item) => String(item.member._id)}
        contentContainerStyle={{ paddingBottom: 32 }}
        renderItem={({ item }) => (
          <TaggedMemberCard
            member={item.member}
            memoryCount={item.count}
            relationshipLabel={item.relationship}
            onPress={(m) => navigation.navigate('SearchMemories', { memberId: String(m._id) })}
          />
        )}
        initialNumToRender={10}
      />
    </Screen>
  );
}
