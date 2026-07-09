import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Avatar } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

function TreeNodeComponent({
  node,
  x,
  y,
  width,
  height,
  selected,
  collapsed,
  hasChildren,
  onPress,
  onToggleCollapse,
  showNickname,
  large,
}) {
  const { colors, layout, radii } = useTheme();
  const size = large ? 56 : 48;

  return (
    <Animated.View
      entering={FadeIn.duration(280)}
      style={[styles.wrap, { left: x, top: y, width, height }]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={() => onPress?.(node)}
        style={({ pressed }) => [
          styles.node,
          {
            opacity: pressed ? 0.92 : 1,
            transform: [{ scale: selected ? 1.06 : 1 }],
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${node.name}, ${node.relationshipLabel}`}
        accessibilityState={{ selected }}
      >
        <View
          style={[
            styles.ring,
            {
              borderColor: selected ? colors.primary : colors.border,
              borderWidth: selected ? 2.5 : StyleSheet.hairlineWidth,
              borderRadius: radii.full,
              padding: 3,
            },
          ]}
        >
          <Avatar uri={node.avatar} name={node.name} size={size} />
        </View>
        <Text
          style={{
            color: colors.text,
            fontFamily: 'Inter_600SemiBold',
            fontSize: (large ? 14 : 12) * layout.fontScale,
            marginTop: 6,
            textAlign: 'center',
            maxWidth: width,
          }}
          numberOfLines={2}
        >
          {node.name}
        </Text>
        {showNickname && node.nickname ? (
          <Text style={{ color: colors.textTertiary, fontSize: 10 * layout.fontScale, textAlign: 'center' }} numberOfLines={1}>
            {node.nickname}
          </Text>
        ) : (
          <Text style={{ color: colors.primary, fontSize: 10 * layout.fontScale, textAlign: 'center' }} numberOfLines={1}>
            {node.relationshipLabel}
          </Text>
        )}
      </Pressable>

      {hasChildren ? (
        <Pressable
          onPress={() => onToggleCollapse?.(node)}
          style={[
            styles.collapseBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radii.full,
              minWidth: layout.minTouch * 0.6,
              minHeight: layout.minTouch * 0.6,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={collapsed ? 'Expand branch' : 'Collapse branch'}
        >
          <Text style={{ color: colors.text, fontSize: 14, fontFamily: 'Inter_700Bold' }}>{collapsed ? '+' : '−'}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

export const TreeNode = memo(TreeNodeComponent);

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center' },
  node: { alignItems: 'center' },
  ring: { alignItems: 'center', justifyContent: 'center' },
  collapseBtn: {
    position: 'absolute',
    bottom: -4,
    right: 4,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
