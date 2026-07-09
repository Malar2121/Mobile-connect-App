import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../utils/responsive';

/**
 * Bottom sheet — glass backdrop, slide-up panel.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  snapHeight,
}) {
  const { colors, isDark, radii, layout } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { isTablet } = useResponsive();
  const panelHeight = snapHeight ?? height * (isTablet ? 0.55 : 0.72);

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close">
          <Animated.View entering={FadeIn.duration(200)} style={StyleSheet.absoluteFill}>
            <BlurView
              intensity={isDark ? 40 : 60}
              tint={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
            />
          </Animated.View>
        </Pressable>

        <Animated.View
          entering={SlideInDown.springify().damping(20)}
          exiting={SlideOutDown.duration(220)}
          style={[
            styles.sheet,
            {
              height: panelHeight,
              backgroundColor: colors.surfaceElevated,
              borderTopLeftRadius: radii['2xl'],
              borderTopRightRadius: radii['2xl'],
              paddingBottom: insets.bottom + layout.sectionGap,
              maxWidth: isTablet ? 560 : undefined,
              alignSelf: isTablet ? 'center' : 'stretch',
              width: isTablet ? '90%' : '100%',
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
          {title ? (
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                  fontSize: 18 * layout.fontScale,
                  paddingHorizontal: layout.contentPadding,
                },
              ]}
            >
              {title}
            </Text>
          ) : null}
          <View style={{ flex: 1, paddingHorizontal: layout.contentPadding }}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    marginBottom: 12,
  },
});

export { BottomSheet as DSBottomSheet };
