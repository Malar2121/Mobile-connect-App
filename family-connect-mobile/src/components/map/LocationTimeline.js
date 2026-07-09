import React, { memo } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SectionTitle } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

function LocationTimelineComponent({ items, title, subtitle }) {
  const { colors, layout } = useTheme();
  if (!items?.length) return null;

  return (
    <View style={{ marginBottom: layout.sectionGap }}>
      {title ? <SectionTitle title={title} subtitle={subtitle} /> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item, index }) => (
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <View style={{ width: 12, alignItems: 'center' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 }} />
              {index < items.length - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: colors.border, marginTop: 4 }} /> : null}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14 * layout.fontScale }}>{item.title}</Text>
              {item.subtitle ? <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>{item.subtitle}</Text> : null}
              {item.time ? <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 4 }}>{item.time}</Text> : null}
            </View>
          </View>
        )}
      />
    </View>
  );
}

export const LocationTimeline = memo(LocationTimelineComponent);
