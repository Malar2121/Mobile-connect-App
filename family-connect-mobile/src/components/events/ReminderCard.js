import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

function ReminderCardComponent({ reminder, onPress }) {
  const { colors, layout, radii } = useTheme();
  const priorityColor =
    reminder.priority === 'high' ? colors.error : reminder.priority === 'medium' ? colors.warning : colors.primary;

  return (
    <Pressable onPress={() => onPress?.(reminder)} accessibilityRole="button">
      <Card style={{ marginBottom: 10, borderLeftWidth: 3, borderLeftColor: priorityColor }}>
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: colors.primarySubtle, borderRadius: radii.md }]}>
            <Ionicons name={reminder.icon ?? 'alarm-outline'} size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 15 * layout.fontScale }}>
              {reminder.title}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>{reminder.subtitle}</Text>
          </View>
          {reminder.countdown ? (
            <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 13 }}>{reminder.countdown}</Text>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

export const ReminderCard = memo(ReminderCardComponent);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
