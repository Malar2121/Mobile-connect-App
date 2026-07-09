import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { formatMemoryDate } from '../../utils/memoryHelpers';

function TimelineCardComponent({ group, onMemoryPress }) {
  const { colors, layout, radii } = useTheme();

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 18 * layout.fontScale, marginBottom: 10 }}>
        {group.label}
      </Text>
      {(group.items ?? []).map((m) => (
        <Pressable
          key={String(m._id)}
          onPress={() => onMemoryPress?.(m)}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg }]}
        >
          <Image source={{ uri: m.mediaUrl }} style={[styles.thumb, { borderRadius: radii.md }]} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }} numberOfLines={2}>
              {m.caption || (m.mediaType === 'video' ? 'Video' : 'Photo')}
            </Text>
            <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 4 }}>{formatMemoryDate(m.createdAt)}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export const TimelineCard = memo(TimelineCardComponent);

const styles = StyleSheet.create({
  card: { flexDirection: 'row', padding: 10, borderWidth: StyleSheet.hairlineWidth, marginBottom: 8, alignItems: 'center' },
  thumb: { width: 56, height: 56 },
});
