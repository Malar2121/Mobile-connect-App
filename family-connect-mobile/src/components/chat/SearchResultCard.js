import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSender } from '../../utils/chatHelpers';
import { useTheme } from '../../hooks/useTheme';

function SearchResultCardComponent({ message, query, onPress }) {
  const { colors, layout, radii } = useTheme();
  const sender = getSender(message);

  return (
    <Pressable onPress={() => onPress?.(message)} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, marginBottom: 10 }]}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg }]}>
        <View style={styles.header}>
          <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 14 * layout.fontScale }}>{sender.fullName}</Text>
          {message.mediaType ? <Ionicons name="attach" size={14} color={colors.textTertiary} /> : null}
        </View>
        <Text style={{ color: colors.text, fontSize: 15 * layout.fontScale }} numberOfLines={2}>
          {message.text || `${message.mediaType} message`}
        </Text>
        {query ? (
          <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 4 }}>Matched: {query}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export const SearchResultCard = memo(SearchResultCardComponent);

const styles = StyleSheet.create({
  card: { padding: 14, borderWidth: StyleSheet.hairlineWidth },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
});
