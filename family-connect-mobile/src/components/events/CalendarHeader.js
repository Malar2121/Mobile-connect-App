import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function CalendarHeaderComponent({ month, year, viewMode, onPrev, onNext, onViewChange }) {
  const { colors, layout, radii } = useTheme();
  const modes = ['month', 'week', 'day', 'agenda'];

  return (
    <View style={styles.wrap}>
      <View style={styles.nav}>
        <Pressable onPress={onPrev} accessibilityLabel="Previous" style={styles.navBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 18 * layout.fontScale }}>
          {MONTHS[month]} {year}
        </Text>
        <Pressable onPress={onNext} accessibilityLabel="Next" style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </Pressable>
      </View>
      <View style={styles.modes}>
        {modes.map((m) => (
          <Pressable
            key={m}
            onPress={() => onViewChange?.(m)}
            style={[
              styles.modeChip,
              {
                backgroundColor: viewMode === m ? colors.primarySubtle : colors.surfaceSecondary,
                borderColor: viewMode === m ? colors.primary : colors.border,
                borderRadius: radii.full,
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: viewMode === m }}
          >
            <Text
              style={{
                color: viewMode === m ? colors.primary : colors.textSecondary,
                fontFamily: viewMode === m ? 'Inter_600SemiBold' : 'Inter_400Regular',
                fontSize: 12 * layout.fontScale,
                textTransform: 'capitalize',
              }}
            >
              {m}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export const CalendarHeader = memo(CalendarHeaderComponent);

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { padding: 8, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  modes: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  modeChip: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: StyleSheet.hairlineWidth },
});
