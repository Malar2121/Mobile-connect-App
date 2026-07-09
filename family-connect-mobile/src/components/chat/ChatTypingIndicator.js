import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { chatTypography } from '../../constants/chatTheme';
import { useTheme } from '../../hooks/useTheme';

function Dot({ delay, color }) {
  const scale = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1, { duration: 320 }), withTiming(0.6, { duration: 320 })),
        -1,
        false,
      ),
    );
  }, [delay, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 0.4 + scale.value * 0.6,
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

export function ChatTypingIndicator({ name }) {
  const { colors } = useTheme();
  if (!name) return null;

  return (
    <View style={styles.wrap}>
      <View style={[styles.bubble, { backgroundColor: colors.card }]}>
        <View style={styles.dots}>
          <Dot delay={0} color={colors.primary} />
          <Dot delay={120} color={colors.primary} />
          <Dot delay={240} color={colors.primary} />
        </View>
        <Text
          style={[
            styles.text,
            { color: colors.textSecondary, fontFamily: chatTypography.fontFamilyRegular },
          ]}
        >
          {name} is typing…
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  bubble: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  text: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
