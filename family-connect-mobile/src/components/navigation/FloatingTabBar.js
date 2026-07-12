import React from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BlurView } from 'expo-blur';

import { Ionicons } from '@expo/vector-icons';

import Animated, {

  useAnimatedStyle,

  useSharedValue,

  withSpring,

} from 'react-native-reanimated';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabConfig } from '../../hooks/useTabConfig';
import { useTheme } from '../../hooks/useTheme';
import { useMotion } from '../../hooks/useMotion';



const AnimatedPressable = Animated.createAnimatedComponent(Pressable);



function TabItem({ item, focused, onPress, colors, isDark, onLayout, index, layout, radii, reduceMotion }) {

  const scale = useSharedValue(focused ? 1 : 0.94);



  React.useEffect(() => {

    scale.value = reduceMotion ? (focused ? 1 : 0.94) : withSpring(focused ? 1 : 0.94, { damping: 14, stiffness: 200 });

  }, [focused, scale, reduceMotion]);



  const animStyle = useAnimatedStyle(() => ({

    transform: [{ scale: scale.value }],

  }));



  return (

    <AnimatedPressable

      onPress={onPress}

      onLayout={(e) => onLayout(index, e)}

      style={[styles.tab, animStyle]}

      accessibilityRole="tab"

      accessibilityState={{ selected: focused }}

      accessibilityLabel={item.label}

      accessibilityHint={focused ? undefined : `${item.label} tab`}

    >

      {focused ? (
        <View
          style={[
            styles.activeBubble,
            {
              backgroundColor: colors.primarySubtle,
              borderColor: colors.primaryMuted,
              borderRadius: radii.full || 999,
            },
          ]}
        >
          <Ionicons name={item.icon} size={23} color={colors.primary} />
        </View>

      ) : (

        <View style={styles.inactive}>

          <Ionicons name={item.iconOutline} size={23} color={colors.textTertiary} />

        </View>

      )}

    </AnimatedPressable>

  );

}



export function FloatingTabBar({ state, descriptors, navigation }) {
  const { colors, isDark, radii, shadows } = useTheme();
  const { reduceMotion } = useMotion();
  const tabConfig = useTabConfig();
  const insets = useSafeAreaInsets();  return (

    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">

      <BlurView intensity={isDark ? 72 : 88} tint={isDark ? 'dark' : 'light'} style={[styles.blur, shadows.lg, { borderRadius: radii['3xl'] }]}>

        <View
          style={[
            styles.bar,
            {
              backgroundColor: colors.tabBar,
              borderColor: colors.tabBarBorder,
              borderRadius: radii['3xl'],
            },
          ]}
        >
          {state.routes.map((route, index) => {

            const focused = state.index === index;

            const config = tabConfig.find((t) => t.route === route.name) ?? tabConfig[0];



            const onPress = () => {

              const event = navigation.emit({

                type: 'tabPress',

                target: route.key,

                canPreventDefault: true,

              });

              if (!focused && !event.defaultPrevented) {

                navigation.navigate(route.name);

              }

            };



            return (

              <TabItem

                key={route.key}

                item={config}

                index={index}

                focused={focused}
                onPress={onPress}
                onLayout={() => {}}

                colors={colors}
                isDark={isDark}
                layout={{}}
                radii={radii}
                reduceMotion={reduceMotion}

              />

            );

          })}

        </View>

      </BlurView>

    </View>

  );

}



const styles = StyleSheet.create({

  wrap: { position: 'absolute', left: 14, right: 14, bottom: 0 },

  blur: { overflow: 'hidden' },

  bar: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: 4,

    paddingVertical: 8,

    borderWidth: StyleSheet.hairlineWidth,

    position: 'relative',

    overflow: 'hidden',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48, zIndex: 1 },

  activeBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderWidth: StyleSheet.hairlineWidth,
  },
  inactive: { padding: 8 },

});

