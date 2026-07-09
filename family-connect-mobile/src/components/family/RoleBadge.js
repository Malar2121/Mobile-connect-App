import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { getRoleDefinition } from '../../utils/familyModuleHelpers';

const ROLE_COLORS = {
  owner: '#7C3AED',
  admin: '#4F56D9',
  parent: '#0EA5E9',
  member: '#64748B',
  child: '#F59E0B',
};

function RoleBadgeComponent({ role, compact }) {
  const { layout, radii } = useTheme();
  const def = getRoleDefinition(role);
  const color = ROLE_COLORS[def.id] ?? ROLE_COLORS.member;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: `${color}18`,
          borderColor: `${color}40`,
          borderRadius: radii.full,
        },
        compact && styles.compact,
      ]}
      accessibilityLabel={`Role: ${def.label}`}
    >
      <Text
        style={{
          color,
          fontFamily: 'Inter_600SemiBold',
          fontSize: (compact ? 11 : 12) * layout.fontScale,
        }}
      >
        {def.label}
      </Text>
    </View>
  );
}

export const RoleBadge = memo(RoleBadgeComponent);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
  compact: { paddingHorizontal: 8, paddingVertical: 3 },
});
