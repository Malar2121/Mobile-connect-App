import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, PageHeader, Avatar, Card, Button, Loader, useToast } from '../../design-system';
import { RelationshipBadge } from '../../components/family';
import {
  RELATIONSHIP_OPTIONS,
  findRelationshipOption,
  uiRelationshipToPayload,
} from '../../utils/familyModuleHelpers';
import { updateMemberRelationship } from '../../services/familyTreeService';
import { useFamilyModuleData } from '../../hooks/useFamilyModuleData';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function RelationshipScreen() {
  const navigation = useNavigation();
  const toast = useToast();
  const { colors, layout, radii } = useTheme();
  const { horizontalPadding } = useResponsive();
  const { members, treeNodes, canManage, loading, refresh, user } = useFamilyModuleData();

  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedRel, setSelectedRel] = useState(null);
  const [saving, setSaving] = useState(false);

  const memberNode = useMemo(() => {
    if (!selectedMember) return null;
    return treeNodes.find((n) => String(n.id) === String(selectedMember._id));
  }, [selectedMember, treeNodes]);

  const handleSelectMember = useCallback((member) => {
    setSelectedMember(member);
    const node = treeNodes.find((n) => String(n.id) === String(member._id));
    setSelectedRel(findRelationshipOption(node)?.id ?? null);
  }, [treeNodes]);

  const handleSave = useCallback(async () => {
    if (!selectedMember || !selectedRel) return;
    const option = RELATIONSHIP_OPTIONS.find((r) => r.id === selectedRel);
    if (!option) return;

    setSaving(true);
    try {
      const payload = {
        userId: String(selectedMember._id),
        ...uiRelationshipToPayload(option),
      };
      await updateMemberRelationship(payload);
      await refresh();
      toast.success(`Relationship updated for ${selectedMember.fullName}`);
    } catch (e) {
      if (e.status === 404) {
        toast.error(
          'FamilyMember record not found. TODO: Backend should auto-create tree nodes for all members.',
        );
      } else {
        toast.error(e.message || 'Could not update relationship');
      }
    } finally {
      setSaving(false);
    }
  }, [selectedMember, selectedRel, refresh, toast]);

  const renderMember = useCallback(
    ({ item }) => {
      const node = treeNodes.find((n) => String(n.id) === String(item._id));
      const rel = findRelationshipOption(node);
      const isSelected = selectedMember?._id === item._id;

      return (
        <Pressable
          onPress={() => handleSelectMember(item)}
          style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, marginBottom: 10 }]}
        >
          <Card style={isSelected ? { borderColor: colors.primary, borderWidth: 2 } : undefined}>
            <View style={styles.memberRow}>
              <Avatar uri={item.avatar} name={item.fullName} size={44} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 16 * layout.fontScale }}>
                  {item.fullName}
                </Text>
                <RelationshipBadge label={rel?.label ?? item.relationshipLabel ?? 'Family member'} compact />
              </View>
              {isSelected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
            </View>
          </Card>
        </Pressable>
      );
    },
    [treeNodes, selectedMember, handleSelectMember, colors, layout],
  );

  return (
    <Screen edges={['top']}>
      <PageHeader
        title="Relationships"
        subtitle="Map your family connections"
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <Loader />
      ) : (
        <>
          <FlatList
            data={members}
            keyExtractor={(item) => String(item._id)}
            renderItem={renderMember}
            contentContainerStyle={{ paddingBottom: 16 }}
            initialNumToRender={8}
            ListHeaderComponent={
              <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginBottom: 12 }}>
                Select a member, then choose their relationship to the family.
                {!canManage ? ' Only admins can edit others.' : ''}
              </Text>
            }
          />

          {selectedMember ? (
            <View style={[styles.panel, { backgroundColor: colors.surface, borderTopColor: colors.border, }]}>
              <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 16 * layout.fontScale, marginBottom: 12 }}>
                Assign relationship for {selectedMember.fullName}
              </Text>
              <View style={styles.relGrid}>
                {RELATIONSHIP_OPTIONS.map((opt) => {
                  const active = selectedRel === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => setSelectedRel(opt.id)}
                      disabled={!canManage && String(selectedMember._id) !== String(user?._id)}
                      style={[
                        styles.relChip,
                        {
                          backgroundColor: active ? colors.primarySubtle : colors.surfaceSecondary,
                          borderColor: active ? colors.primary : colors.border,
                          borderRadius: radii.lg,
                          minHeight: layout.minTouch,
                        },
                      ]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                    >
                      <Text
                        style={{
                          color: active ? colors.primary : colors.text,
                          fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                          fontSize: 14 * layout.fontScale,
                        }}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {!memberNode ? (
                <Text style={{ color: colors.warning, fontSize: 12, marginTop: 10 }}>
                  No FamilyMember tree record — save may fail until backend seeds tree nodes.
                </Text>
              ) : null}

              <Button
                title="Save relationship"
                onPress={handleSave}
                loading={saving}
                disabled={!selectedRel}
                style={{ marginTop: 14, marginBottom: 24 }}
              />
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  memberRow: { flexDirection: 'row', alignItems: 'center' },
  panel: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16 },
  relGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  relChip: { paddingHorizontal: 14, paddingVertical: 12, borderWidth: StyleSheet.hairlineWidth },
});
