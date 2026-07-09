import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { dashboardTypography } from '../../constants/dashboardTheme';

export function DashboardAnimatedNumber({ value, style, duration = 700 }) {
  const [display, setDisplay] = useState(0);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    const start = display;
    const diff = value - start;
    const startTime = Date.now();

    opacity.value = withTiming(1, { duration: 280 });

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(start + diff * eased));
      if (t < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [value, duration]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      style={[{ fontFamily: dashboardTypography.fontBold }, style, animStyle]}
    >
      {display}
    </Animated.Text>
  );
}
