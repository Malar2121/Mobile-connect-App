import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SectionTitle } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

const ACTIONS = [
  { id: 'tree', label: 'Interactive tree', icon: 'git-network', screen: 'InteractiveTree' },
  { id: 'ancestors', label: 'Ancestors', icon: 'arrow-up', screen: 'Ancestors' },
  { id: 'descendants', label: 'Descendants', icon: 'arrow-down', screen: 'Descendants' },
  { id: 'timeline', label: 'Heritage', icon: 'time', screen: 'HeritageTimeline' },
  { id: 'legacy', label: 'Legacy', icon: 'heart', screen: 'LegacyProfiles' },
  { id: 'history', label: 'Journal', icon: 'book', screen: 'FamilyHistory' },
  { id: 'edit', label: 'Relationships', icon: 'create', screen: 'RelationshipEditor' },
  { id: 'settings', label: 'Settings', icon: 'options', screen: 'TreeSettings' },
];

function TreeQuickActionsComponent({ onNavigate, isMinor }) {
  const { colors, layout, radii } = useTheme();
  const { horizontalPadding, columns } = useResponsive();
  const visible = ACTIONS.filter((a) => !(isMinor && a.id === 'edit'));

  return (
    <View style={{ paddingHorizontal: horizontalPadding, marginBottom: layout.sectionGap }}>
      <SectionTitle title="Explore" subtitle="Navigate your heritage" />
      <View style={[styles.grid, { gap: 10 }]}>
        {visible.map((action) => (
          <Pressable
            key={action.id}
            onPress={() => onNavigate?.(action.screen)}
            style={({ pressed }) => [
              styles.tile,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radii.xl,
                minHeight: layout.minTouch + 16,
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
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 12 * layout.fontScale, marginTop: 8, textAlign: 'center' }}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export const TreeQuickActions = memo(TreeQuickActionsComponent);

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { padding: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
});
