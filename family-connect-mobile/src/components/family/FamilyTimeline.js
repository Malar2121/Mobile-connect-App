import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SectionTitle } from '../../design-system';
import { TimelineItem } from './TimelineItem';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

function FamilyTimelineComponent({ items, title = 'Family timeline', subtitle }) {
  const { colors, layout, radii } = useTheme();
  const { horizontalPadding } = useResponsive();

  return (
    <View style={{ paddingHorizontal: horizontalPadding, marginBottom: layout.sectionGap }}>
      <SectionTitle title={title} subtitle={subtitle} />
      {items.length === 0 ? (
        <View
          style={[
            styles.empty,
            {
              backgroundColor: colors.surfaceSecondary,
              borderRadius: radii.xl,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="time-outline" size={28} color={colors.textTertiary} />
          <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 14 * layout.fontScale }}>
            Family milestones will appear here.
          </Text>
        </View>
      ) : (
        items.map((item, index) => (
          <TimelineItem key={item.id} item={item} isLast={index === items.length - 1} />
        ))
      )}
    </View>
  );
}

export const FamilyTimeline = memo(FamilyTimelineComponent);

const styles = StyleSheet.create({
  empty: { alignItems: 'center', padding: 24, borderWidth: StyleSheet.hairlineWidth },
});
