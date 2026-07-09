import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Card } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

function PersonCardComponent({ person, subtitle, onPress, compact, selected }) {
  const { colors, layout, radii } = useTheme();
  if (!person) return null;

  return (
    <Pressable onPress={() => onPress?.(person)} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1, marginBottom: compact ? 8 : 12 }]}>
      <Card
        style={
          selected
            ? { borderColor: colors.primary, borderWidth: 2 }
            : compact
              ? { paddingVertical: 10, paddingHorizontal: 12 }
              : undefined
        }
      >
        <View style={styles.row}>
          <Avatar uri={person.avatar} name={person.name ?? person.fullName} size={compact ? 40 : 52} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: (compact ? 15 : 17) * layout.fontScale }}>
              {person.name ?? person.fullName}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale, marginTop: 2 }}>
              {subtitle ?? person.relationshipLabel ?? person.nickname ?? 'Family member'}
            </Text>
          </View>
          {onPress ? (
            <View style={[styles.chev, { backgroundColor: colors.primarySubtle, borderRadius: radii.full }]}>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </View>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

export const PersonCard = memo(PersonCardComponent);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  chev: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
});
