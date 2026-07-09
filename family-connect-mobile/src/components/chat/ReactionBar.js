import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function ReactionBarComponent({ reactions, onReactionPress }) {
  if (!reactions?.length) return null;
  const grouped = reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <View style={styles.row}>
      {Object.entries(grouped).map(([emoji, count]) => (
        <Pressable key={emoji} onPress={() => onReactionPress?.(emoji)} style={styles.chip}>
          <Text style={styles.emoji}>{emoji}{count > 1 ? ` ${count}` : ''}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export const ReactionBar = memo(ReactionBarComponent);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4, marginLeft: 4 },
  chip: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 14, paddingHorizontal: 8, paddingVertical: 2, elevation: 2 },
  emoji: { fontSize: 13 },
});
