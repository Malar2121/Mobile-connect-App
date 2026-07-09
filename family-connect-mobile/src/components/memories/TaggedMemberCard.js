import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../design-system';
import { RelationshipBadge } from '../family/RelationshipBadge';
import { useTheme } from '../../hooks/useTheme';

function TaggedMemberCardComponent({ member, memoryCount, relationshipLabel, onPress }) {
  const { colors, layout, radii } = useTheme();

  return (
    <Pressable
      onPress={() => onPress?.(member)}
      style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl, minHeight: layout.minTouch }]}
    >
      <Avatar uri={member.avatar} name={member.fullName} size={layout.avatarSize + 4} />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 16 * layout.fontScale }}>{member.fullName}</Text>
        {relationshipLabel ? <RelationshipBadge label={relationshipLabel} compact /> : null}
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>{memoryCount} tagged memories</Text>
      </View>
    </Pressable>
  );
}

export const TaggedMemberCard = memo(TaggedMemberCardComponent);

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: StyleSheet.hairlineWidth, marginBottom: 10 },
});
