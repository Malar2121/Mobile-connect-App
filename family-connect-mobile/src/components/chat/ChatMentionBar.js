import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { chatTypography } from '../../constants/chatTheme';
import { useTheme } from '../../hooks/useTheme';

export function ChatMentionBar({ draft, members, onSelect }) {
  const { colors, isDark } = useTheme();
  const atIndex = draft.lastIndexOf('@');
  if (atIndex === -1) return null;

  const query = draft.slice(atIndex + 1).toLowerCase();
  if (query.includes(' ')) return null;

  const filtered = (members ?? [])
    .map((m) => m.user ?? m)
    .filter((u) => !query || (u.fullName ?? '').toLowerCase().includes(query));

  if (!filtered.length) return null;

  return (
    <View style={[styles.wrap, { backgroundColor: isDark ? colors.card : '#fff', borderColor: colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {filtered.map((user) => (
          <Pressable
            key={user._id}
            onPress={() => onSelect?.(user)}
            style={[styles.chip, { backgroundColor: isDark ? 'rgba(129,140,248,0.15)' : 'rgba(99,102,241,0.1)' }]}
          >
            <Text style={{ color: colors.primary, fontFamily: chatTypography.fontFamilySemi }}>
              @{user.fullName}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 8,
  },
  row: { gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
});
