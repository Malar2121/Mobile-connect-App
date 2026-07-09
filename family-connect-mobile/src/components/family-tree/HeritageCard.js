import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

function HeritageCardComponent({ item, onPress }) {
  const { colors, layout, radii } = useTheme();
  if (!item) return null;

  const typeColors = {
    birth: colors.primary,
    marriage: '#EC4899',
    event: '#6366F1',
    memory: '#10B981',
    legacy: '#A855F7',
    achievement: '#F59E0B',
  };

  return (
    <Pressable onPress={() => onPress?.(item)} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1, marginBottom: 10 }]}>
      <Card style={{ paddingVertical: 14, paddingHorizontal: 14 }}>
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: (typeColors[item.type] ?? colors.primary) + '22', borderRadius: radii.md }]}>
            <Ionicons name={item.icon ?? 'time-outline'} size={18} color={typeColors[item.type] ?? colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 15 * layout.fontScale }} numberOfLines={2}>
              {item.title}
            </Text>
            {item.body ? (
              <Text style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale, marginTop: 4 }} numberOfLines={2}>
                {item.body}
              </Text>
            ) : null}
            {item.date ? (
              <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 6 }}>
                {new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </Text>
            ) : null}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export const HeritageCard = memo(HeritageCardComponent);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
