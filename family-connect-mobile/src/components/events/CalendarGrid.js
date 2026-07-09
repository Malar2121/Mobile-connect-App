import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { getEventCategory } from '../../utils/eventModuleHelpers';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function CalendarGridComponent({ month, year, selectedDate, eventsByDay, onSelectDate, onEventPress }) {
  const { colors, layout, radii } = useTheme();
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const items = [];
    for (let i = 0; i < startPad; i++) items.push({ empty: true, key: `pad-${i}` });
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${year}-${month}-${day}`;
      items.push({ day, key, events: eventsByDay[key] ?? [] });
    }
    return items;
  }, [month, year, eventsByDay]);

  return (
    <View>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={[styles.weekday, { color: colors.textTertiary, fontSize: 11 * layout.fontScale }]}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((cell) => {
          if (cell.empty) return <View key={cell.key} style={styles.cell} />;
          const isToday = cell.key === todayKey;
          const isSelected =
            selectedDate &&
            cell.key === `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
          const dotColor = cell.events[0] ? getEventCategory(cell.events[0]).color : colors.primary;

          return (
            <Pressable
              key={cell.key}
              onPress={() => onSelectDate?.(new Date(year, month, cell.day))}
              style={[
                styles.cell,
                isSelected && { backgroundColor: colors.primarySubtle, borderRadius: radii.md },
                isToday && !isSelected && { borderWidth: 1, borderColor: colors.primary, borderRadius: radii.md },
              ]}
              accessibilityLabel={`${cell.day}, ${cell.events.length} events`}
            >
              <Text
                style={{
                  color: isToday ? colors.primary : colors.text,
                  fontFamily: isToday ? 'Inter_700Bold' : 'Inter_400Regular',
                  fontSize: 14 * layout.fontScale,
                }}
              >
                {cell.day}
              </Text>
              {cell.events.length > 0 ? (
                <View style={styles.dots}>
                  {cell.events.slice(0, 3).map((ev, i) => (
                    <Pressable key={String(ev._id) + i} onPress={() => onEventPress?.(ev)}>
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: getEventCategory(ev).color ?? dotColor },
                        ]}
                      />
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const CalendarGrid = memo(CalendarGridComponent);

const styles = StyleSheet.create({
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: { flex: 1, textAlign: 'center', fontFamily: 'Inter_600SemiBold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', minHeight: 52, alignItems: 'center', paddingTop: 6, paddingBottom: 4 },
  dots: { flexDirection: 'row', gap: 3, marginTop: 4 },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
