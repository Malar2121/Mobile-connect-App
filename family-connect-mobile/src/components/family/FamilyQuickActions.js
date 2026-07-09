import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SectionTitle } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

const ACTIONS = [
  { id: 'members', label: 'Members', icon: 'people-outline', screen: 'FamilyMembers' },
  { id: 'invite', label: 'Invite', icon: 'person-add-outline', screen: 'InviteMembers', admin: true },
  { id: 'requests', label: 'Requests', icon: 'mail-unread-outline', screen: 'JoinRequests', admin: true },
  { id: 'roles', label: 'Roles', icon: 'shield-outline', screen: 'FamilyRoles' },
  { id: 'relationships', label: 'Relationships', icon: 'git-network-outline', screen: 'Relationship' },
  { id: 'tree', label: 'Family tree', icon: 'git-network', screen: 'FamilyTreeModule', parent: true },
  { id: 'permissions', label: 'Privacy', icon: 'lock-closed-outline', screen: 'FamilyPermissions' },
  { id: 'settings', label: 'Settings', icon: 'settings-outline', screen: 'FamilySettings', admin: true },
];

function FamilyQuickActionsComponent({ onNavigate, canManage }) {
  const { colors, layout, radii } = useTheme();
  const { horizontalPadding, columns } = useResponsive();
  const visible = ACTIONS.filter((a) => !a.admin || canManage);

  return (
    <View style={{ paddingHorizontal: horizontalPadding, marginBottom: layout.sectionGap }}>
      <SectionTitle title="Quick actions" />
      <View style={[styles.grid, { gap: 10 }]}>
        {visible.map((action) => (
          <Pressable
            key={action.id}
            onPress={() => onNavigate?.(action)}
            style={({ pressed }) => [
              styles.tile,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radii.xl,
                minHeight: layout.minTouch + 20,
                width: columns >= 3 ? '31%' : '48%',
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <View style={[styles.icon, { backgroundColor: colors.primarySubtle, borderRadius: radii.md }]}>
              <Ionicons name={action.icon} size={22} color={colors.primary} />
            </View>
            <Text
              style={{
                color: colors.text,
                fontFamily: 'Inter_600SemiBold',
                fontSize: 13 * layout.fontScale,
                marginTop: 10,
              }}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export const FamilyQuickActions = memo(FamilyQuickActionsComponent);

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: {
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
