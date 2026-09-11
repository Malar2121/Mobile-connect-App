import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SectionTitle } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';
import { useI18n, translate } from '../../i18n';

const ACTIONS = [
  { id: 'tree', get label() { return translate('tree.interactive'); }, icon: 'git-network', screen: 'InteractiveTree' },
  { id: 'ancestors', get label() { return translate('tree.ancestors'); }, icon: 'arrow-up', screen: 'Ancestors' },
  { id: 'descendants', get label() { return translate('tree.descendants'); }, icon: 'arrow-down', screen: 'Descendants' },
  { id: 'timeline', get label() { return translate('tree.heritage2'); }, icon: 'time', screen: 'HeritageTimeline' },
  { id: 'legacy', get label() { return translate('memories.quickLegacy'); }, icon: 'heart', screen: 'LegacyProfiles' },
  { id: 'history', get label() { return translate('tree.journal'); }, icon: 'book', screen: 'FamilyHistory' },
  { id: 'edit', get label() { return translate('tree.relationships'); }, icon: 'create', screen: 'RelationshipEditor' },
  { id: 'settings', get label() { return translate('profile.settings'); }, icon: 'options', screen: 'TreeSettings' },
];

function TreeQuickActionsComponent({ onNavigate, isMinor }) {
  const { colors, layout, radii } = useTheme();

  const { t } = useI18n();
  const { horizontalPadding, columns } = useResponsive();
  const visible = ACTIONS.filter((a) => !(isMinor && a.id === 'edit'));

  return (
    <View style={{ paddingHorizontal: horizontalPadding, marginBottom: layout.sectionGap }}>
      <SectionTitle title={t('tree.explore')} subtitle={t('tree.navigateHeritage')} />
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
