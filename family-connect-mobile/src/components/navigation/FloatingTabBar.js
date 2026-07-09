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

              borderRadius: radii.pill,

            },

          ]}

        >

          <Ionicons name={item.icon} size={20} color={colors.primary} />

          <Text

            style={[

              styles.activeLabel,

              { color: colors.primary, fontFamily: 'Inter_600SemiBold' },

            ]}

          >

            {item.label}

          </Text>

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

  const insets = useSafeAreaInsets();

  const bubbleX = useSharedValue(0);

  const bubbleW = useSharedValue(0);

  const layouts = React.useRef({});



  const onTabLayout = React.useCallback(

    (index, event) => {

      const { x, width } = event.nativeEvent.layout;

      layouts.current[index] = { x, width };

      if (state.index === index) {

        bubbleX.value = reduceMotion ? x : withSpring(x, { damping: 18, stiffness: 220 });

        bubbleW.value = reduceMotion ? width : withSpring(width, { damping: 18, stiffness: 220 });

      }

    },

    [bubbleW, bubbleX, state.index, reduceMotion],

  );



  React.useEffect(() => {

    const layout = layouts.current[state.index];

    if (layout) {

      bubbleX.value = reduceMotion ? layout.x : withSpring(layout.x, { damping: 18, stiffness: 220 });

      bubbleW.value = reduceMotion ? layout.width : withSpring(layout.width, { damping: 18, stiffness: 220 });

    }

  }, [state.index, bubbleW, bubbleX, reduceMotion]);



  const bubbleStyle = useAnimatedStyle(() => ({

    transform: [{ translateX: bubbleX.value }],

    width: bubbleW.value,

  }));



  return (

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

          <Animated.View

            pointerEvents="none"

            style={[

              styles.slidingBubble,

              bubbleStyle,

              { backgroundColor: colors.primarySubtle, borderRadius: radii.xl },

            ]}

          />

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

                onLayout={onTabLayout}

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

  slidingBubble: { position: 'absolute', top: 8, bottom: 8, left: 0 },

  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48, zIndex: 1 },

  activeBubble: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 5,

    paddingHorizontal: 10,

    paddingVertical: 8,

    borderWidth: StyleSheet.hairlineWidth,

  },

  activeLabel: { fontSize: 11 },

  inactive: { padding: 8 },

});

