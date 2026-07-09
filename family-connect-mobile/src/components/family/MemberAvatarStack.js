import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

const AVATAR_SIZE = 42;
const OVERLAP = 14;

function MemberAvatarStackComponent({ members, max = 6, style }) {
  const { colors } = useTheme();
  const visible = (members ?? []).slice(0, max);
  const extra = Math.max(0, (members?.length ?? 0) - visible.length);

  return (
    <View style={[styles.row, style]} accessibilityLabel={`${members?.length ?? 0} family members`}>
      {visible.map((member, index) => (
        <View
          key={String(member._id ?? member.id)}
          style={[
            styles.wrap,
            {
              marginLeft: index === 0 ? 0 : -OVERLAP,
              zIndex: visible.length - index,
              borderColor: colors.surface,
            },
          ]}
        >
          <Avatar uri={member.avatar} name={member.fullName ?? member.name} size={AVATAR_SIZE} />
        </View>
      ))}
      {extra > 0 ? (
        <View
          style={[
            styles.more,
            {
              marginLeft: -OVERLAP,
              backgroundColor: colors.primarySubtle,
              borderColor: colors.surface,
            },
          ]}
        >
          <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 12 }}>+{extra}</Text>
        </View>
      ) : null}
    </View>
  );
}

export const MemberAvatarStack = memo(MemberAvatarStackComponent);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  wrap: { borderRadius: 22, borderWidth: 3 },
  more: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
