import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SectionTitle } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

function EventTimelineComponent({ items, title = 'Event history' }) {
  const { colors, layout, radii } = useTheme();

  return (
    <View>
      <SectionTitle title={title} />
      {items.length === 0 ? (
        <Text style={{ color: colors.textSecondary }}>No completed events yet.</Text>
      ) : (
        items.map((item, index) => (
          <View key={item.id} style={styles.row} accessibilityLabel={item.title}>
            <View style={styles.rail}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              {index < items.length - 1 ? <View style={[styles.line, { backgroundColor: colors.border }]} /> : null}
            </View>
            <View style={[styles.content, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg }]}>
              <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14 * layout.fontScale }}>
                {item.title}
              </Text>
              {item.subtitle ? (
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>{item.subtitle}</Text>
              ) : null}
              {item.meta ? (
                <View style={styles.meta}>
                  <Ionicons name="people-outline" size={14} color={colors.textTertiary} />
                  <Text style={{ color: colors.textTertiary, fontSize: 12, marginLeft: 4 }}>{item.meta}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

export const EventTimeline = memo(EventTimelineComponent);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 12 },
  rail: { width: 20, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  line: { width: 2, flex: 1, marginTop: 4 },
  content: { flex: 1, padding: 12, borderWidth: StyleSheet.hairlineWidth, marginLeft: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
});
