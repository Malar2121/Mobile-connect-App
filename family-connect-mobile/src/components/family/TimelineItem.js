import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

function TimelineItemComponent({ item, isLast }) {
  const { colors, layout, radii } = useTheme();

  return (
    <View style={styles.row} accessibilityLabel={`${item.title}. ${item.time}`}>
      <View style={styles.rail}>
        <View style={[styles.dot, { backgroundColor: colors.primary, borderColor: colors.primarySubtle }]} />
        {!isLast ? <View style={[styles.line, { backgroundColor: colors.border }]} /> : null}
      </View>
      <View
        style={[
          styles.content,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radii.lg,
            marginBottom: isLast ? 0 : 12,
          },
        ]}
      >
        <View style={styles.header}>
          {item.avatar ? (
            <Avatar uri={item.avatar} name={item.actorName} size={36} />
          ) : (
            <View style={[styles.iconCircle, { backgroundColor: colors.primarySubtle }]}>
              <Ionicons name={item.icon ?? 'ellipse-outline'} size={18} color={colors.primary} />
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text
              style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14 * layout.fontScale }}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            {item.body ? (
              <Text
                style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale, marginTop: 2 }}
                numberOfLines={2}
              >
                {item.body}
              </Text>
            ) : null}
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: 11, marginLeft: 8 }}>{item.time}</Text>
        </View>
      </View>
    </View>
  );
}

export const TimelineItem = memo(TimelineItemComponent);

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  rail: { width: 24, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 3 },
  line: { width: 2, flex: 1, marginTop: 4 },
  content: { flex: 1, padding: 12, borderWidth: StyleSheet.hairlineWidth, marginLeft: 8 },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
