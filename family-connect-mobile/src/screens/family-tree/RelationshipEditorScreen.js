import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, PageHeader, Card, Avatar, Loader, useToast } from '../../design-system';
import { useFamilyTreeModuleData } from '../../hooks/useFamilyTreeModuleData';
import { RelationshipEditor } from '../../components/family-tree';
import { updateMemberRelationship } from '../../services/familyTreeService';
import {
  findTreeRelationshipOption,
  treeRelationshipToPayload,
  TREE_RELATIONSHIP_OPTIONS,
} from '../../utils/familyTreeModuleHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function RelationshipEditorScreen() {
  const navigation = useNavigation();
  const toast = useToast();
  const { colors, layout } = useTheme();
  const { horizontalPadding } = useResponsive();
  const { members, treeNodes, canManage, user, loading, refresh } = useFamilyTreeModuleData();

  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedRelId, setSelectedRelId] = useState(null);
  const [relatedToId, setRelatedToId] = useState(null);
  const [saving, setSaving] = useState(false);

  const memberNode = useMemo(() => {
    if (!selectedMember) return null;
    return treeNodes.find((n) => String(n.id) === String(selectedMember._id));
  }, [selectedMember, treeNodes]);

  const canEdit = canManage || String(selectedMember?._id) === String(user?._id);

  const handleSelectMember = useCallback(
    (member) => {
      setSelectedMember(member);
      const node = treeNodes.find((n) => String(n.id) === String(member._id));
      const opt = findTreeRelationshipOption(node);
      setSelectedRelId(opt?.id ?? null);
      setRelatedToId(node?.relatedTo ? String(node.relatedTo) : null);
    },
    [treeNodes],
  );

  const handleSave = useCallback(async () => {
    if (!selectedMember || !selectedRelId) return;
    const relOption = TREE_RELATIONSHIP_OPTIONS.find((r) => r.id === selectedRelId);
    if (!relOption) return;

    setSaving(true);
    try {
      await updateMemberRelationship({
        userId: String(selectedMember._id),
        ...treeRelationshipToPayload(relOption, relatedToId),
      });
      await refresh();
      toast.success(`Relationship updated for ${selectedMember.fullName}`);
    } catch (e) {
      if (e.status === 404) {
        toast.error('FamilyMember record not found. TODO: auto-create tree nodes for all members.');
      } else {
        toast.error(e.message || 'Could not update relationship');
      }
    } finally {
      setSaving(false);
    }
  }, [selectedMember, selectedRelId, relatedToId, refresh, toast]);

  const renderMember = useCallback(
    ({ item }) => {
      const isSelected = selectedMember?._id === item._id;
      return (
        <Pressable onPress={() => handleSelectMember(item)} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, marginBottom: 10 }]}>
          <Card style={isSelected ? { borderColor: colors.primary, borderWidth: 2 } : undefined}>
            <View style={styles.row}>
              <Avatar uri={item.avatar} name={item.fullName} size={44} />
              <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 16 * layout.fontScale, marginLeft: 12 }}>
                {item.fullName}
              </Text>
            </View>
          </Card>
        </Pressable>
      );
    },
    [selectedMember, handleSelectMember, colors, layout],
  );

  return (
    <Screen edges={['top']}>
      <PageHeader title="Relationship editor" subtitle="Father, mother, spouse, child & more" onBack={() => navigation.goBack()} />

      {loading ? (
        <Loader />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => String(item._id)}
          renderItem={renderMember}
          contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 24 }}
          initialNumToRender={8}
          ListHeaderComponent={
            selectedMember ? (
              <RelationshipEditor
                member={selectedMember}
                members={members}
                selectedRelId={selectedRelId}
                relatedToId={relatedToId}
                onSelectRel={setSelectedRelId}
                onSelectRelatedTo={setRelatedToId}
                onSave={handleSave}
                saving={saving}
                canEdit={canEdit}
                warning={!memberNode ? 'No FamilyMember tree record — save may fail until backend seeds nodes.' : null}
              />
            ) : (
              <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginBottom: 12 }}>
                Select a member below to edit their relationship.
              </Text>
            )
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
