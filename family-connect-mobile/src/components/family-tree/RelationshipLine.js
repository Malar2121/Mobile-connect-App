import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

function RelationshipLineComponent({ x1, y1, x2, y2, animated }) {
  const { colors } = useTheme();
  const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  const line = (
    <View
      style={[
        styles.line,
        {
          width: length,
          left: midX - length / 2,
          top: midY,
          backgroundColor: colors.border,
          transform: [{ rotate: `${angle}deg` }],
        },
      ]}
    />
  );

  if (animated) {
    return <Animated.View entering={FadeIn.duration(400)}>{line}</Animated.View>;
  }
  return line;
}

export const RelationshipLine = memo(RelationshipLineComponent);

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
  },
});
