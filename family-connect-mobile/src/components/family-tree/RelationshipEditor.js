import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, Button } from '../../design-system';
import { TREE_RELATIONSHIP_OPTIONS } from '../../utils/familyTreeModuleHelpers';
import { useTheme } from '../../hooks/useTheme';

function RelationshipEditorComponent({
  member,
  members,
  selectedRelId,
  relatedToId,
  onSelectRel,
  onSelectRelatedTo,
  onSave,
  saving,
  canEdit,
  warning,
}) {
  const { colors, layout, radii } = useTheme();

  const others = (members ?? []).filter((m) => String(m._id) !== String(member?._id));

  const renderRelChip = useCallback(
    (opt) => {
      const active = selectedRelId === opt.id;
      return (
        <Pressable
          key={opt.id}
          onPress={() => canEdit && onSelectRel?.(opt.id)}
          disabled={!canEdit}
          style={[
            styles.chip,
            {
              backgroundColor: active ? colors.primarySubtle : colors.surfaceSecondary,
              borderColor: active ? colors.primary : colors.border,
              borderRadius: radii.lg,
              minHeight: layout.minTouch,
              opacity: canEdit ? 1 : 0.6,
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
    },
    [selectedRelId, canEdit, onSelectRel, colors, layout, radii],
  );

  if (!member) return null;

  return (
    <View>
      <View style={styles.memberHeader}>
        <Avatar uri={member.avatar} name={member.fullName} size={52} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 18 * layout.fontScale }}>{member.fullName}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale }}>Choose relationship type</Text>
        </View>
      </View>

      <View style={styles.grid}>{TREE_RELATIONSHIP_OPTIONS.map(renderRelChip)}</View>

      {['child', 'spouse', 'sibling', 'grandchild'].includes(
        TREE_RELATIONSHIP_OPTIONS.find((r) => r.id === selectedRelId)?.backendType,
      ) || selectedRelId ? (
        <View style={{ marginTop: 16 }}>
          <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 15 * layout.fontScale, marginBottom: 10 }}>
            Related to
          </Text>
          <View style={styles.grid}>
            {others.map((m) => {
              const active = relatedToId === String(m._id);
              return (
                <Pressable
                  key={m._id}
                  onPress={() => canEdit && onSelectRelatedTo?.(String(m._id))}
                  disabled={!canEdit}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.primarySubtle : colors.surfaceSecondary,
                      borderColor: active ? colors.primary : colors.border,
                      borderRadius: radii.lg,
                      minHeight: layout.minTouch,
                    },
                  ]}
                >
                  <Text style={{ color: active ? colors.primary : colors.text, fontSize: 13 * layout.fontScale }}>{m.fullName}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {warning ? (
        <Text style={{ color: colors.warning, fontSize: 12, marginTop: 12 }}>{warning}</Text>
      ) : null}

      <Button
        title="Save relationship"
        onPress={onSave}
        loading={saving}
        disabled={!canEdit || !selectedRelId}
        style={{ marginTop: 20 }}
      />
    </View>
  );
}

export const RelationshipEditor = memo(RelationshipEditorComponent);

const styles = StyleSheet.create({
  memberHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 12, borderWidth: StyleSheet.hairlineWidth },
});
