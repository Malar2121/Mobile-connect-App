import React, { memo } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SectionTitle } from '../../design-system';
import { HeritageCard } from './HeritageCard';
import { useTheme } from '../../hooks/useTheme';

function TimelineSectionComponent({ title, subtitle, items, onPressItem, emptyMessage }) {
  const { colors, layout } = useTheme();

  if (!items?.length) {
    return emptyMessage ? (
      <View style={{ marginBottom: layout.sectionGap }}>
        <SectionTitle title={title} subtitle={subtitle} />
        <Text style={{ color: colors.textTertiary, fontSize: 14 * layout.fontScale }}>{emptyMessage}</Text>
      </View>
    ) : null;
  }

  return (
    <View style={{ marginBottom: layout.sectionGap }}>
      <SectionTitle title={title} subtitle={subtitle} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <HeritageCard item={item} onPress={onPressItem} />}
        scrollEnabled={false}
        initialNumToRender={6}
      />
    </View>
  );
}

export const TimelineSection = memo(TimelineSectionComponent);
