import React, { forwardRef, memo, useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { TreeNode } from './TreeNode';
import { RelationshipLine } from './RelationshipLine';
import { GenerationHeader } from './GenerationHeader';
import { layoutTree, buildAdjacency } from '../../utils/familyTreeModuleHelpers';
import { useTheme } from '../../hooks/useTheme';

// Zoom buttons use the same limits as the pinch gesture.
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 1.25;
const ZOOM_ANIMATION = { duration: 200 };
const FIT_MARGIN = 24;
const CANVAS_TOP = 24; // matches marginTop on the canvas below
const clampZoom = (value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

function TreeCanvasComponent({
  nodes,
  selectedId,
  onSelectNode,
  collapsedIds,
  onToggleCollapse,
  showGenerationLabels,
  showNicknames,
  animateConnections,
  largeNodes,
  settings,
}, ref) {
  const { colors } = useTheme();
  const collapsed = collapsedIds ?? new Set();
  const layout = useMemo(() => layoutTree(nodes, collapsed), [nodes, collapsed]);
  const { childrenOf } = useMemo(() => buildAdjacency(nodes), [nodes]);

  const scale = useSharedValue(settings?.defaultZoom ?? 1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.min(2.5, Math.max(0.4, savedScale.value * e.scale));
    });

  const pan = Gesture.Pan()
    .onStart(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = savedX.value + e.translationX;
      translateY.value = savedY.value + e.translationY;
    })
    .onEnd(() => {
      translateX.value = withSpring(translateX.value);
      translateY.value = withSpring(translateY.value);
    });

  const composed = Gesture.Simultaneous(pinch, pan);

  const canvasStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const [viewport, setViewport] = useState({ width: 300, height: 400 });

  const onLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    setViewport({ width, height });
  }, []);

  // Used by the TreeControls buttons on the screen.
  useImperativeHandle(
    ref,
    () => ({
      zoomIn() {
        scale.value = withTiming(clampZoom(scale.value * ZOOM_STEP), ZOOM_ANIMATION);
      },
      zoomOut() {
        scale.value = withTiming(clampZoom(scale.value / ZOOM_STEP), ZOOM_ANIMATION);
      },
      reset() {
        scale.value = withTiming(settings?.defaultZoom ?? 1, ZOOM_ANIMATION);
        translateX.value = withTiming(0, ZOOM_ANIMATION);
        translateY.value = withTiming(0, ZOOM_ANIMATION);
      },
      fit() {
        const fitScale = clampZoom(
          Math.min(
            (viewport.width - FIT_MARGIN * 2) / layout.canvasWidth,
            (viewport.height - FIT_MARGIN * 2) / layout.canvasHeight,
          ),
        );
        // Scaling keeps the canvas centre in place. It is already centred horizontally,
        // so only move its centre down/up to the middle of the viewport.
        scale.value = withTiming(fitScale, ZOOM_ANIMATION);
        translateX.value = withTiming(0, ZOOM_ANIMATION);
        translateY.value = withTiming(viewport.height / 2 - (CANVAS_TOP + layout.canvasHeight / 2), ZOOM_ANIMATION);
      },
    }),
    [scale, translateX, translateY, settings?.defaultZoom, viewport, layout.canvasWidth, layout.canvasHeight],
  );

  const lines = useMemo(() => {
    const result = [];
    nodes.forEach((n) => {
      const from = layout.positions[String(n.id)];
      if (!from || !n.relatedTo) return;
      const to = layout.positions[String(n.relatedTo)];
      if (!to) return;
      if (collapsed.has(String(n.relatedTo))) return;

      const x1 = layout.offsetX + from.x;
      const y1 = from.y + from.height * 0.35;
      const x2 = layout.offsetX + to.x;
      const y2 = to.y + to.height * 0.65;

      result.push({
        key: `${n.id}-${n.relatedTo}`,
        x1,
        y1,
        x2,
        y2,
        highlight: selectedId && (String(n.id) === selectedId || String(n.relatedTo) === selectedId),
      });
    });
    return result;
  }, [nodes, layout, collapsed, selectedId]);

  const genHeaders = useMemo(() => {
    if (!showGenerationLabels) return [];
    const seen = new Set();
    return Object.entries(layout.positions)
      .map(([id, pos]) => ({ id, ...pos }))
      .filter((p) => {
        if (seen.has(p.generation)) return false;
        seen.add(p.generation);
        return true;
      });
  }, [layout.positions, showGenerationLabels]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceSecondary }]} onLayout={onLayout}>
      <GestureDetector gesture={composed}>
        <Animated.View
          style={[
            styles.canvas,
            {
              width: layout.canvasWidth,
              height: layout.canvasHeight,
              marginLeft: (viewport.width - layout.canvasWidth) / 2,
              marginTop: CANVAS_TOP,
            },
            canvasStyle,
          ]}
        >
          {lines.map((l) => (
            <RelationshipLine
              key={l.key}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              animated={animateConnections !== false}
            />
          ))}

          {genHeaders.map((g) => (
            <GenerationHeader
              key={`gen-${g.generation}`}
              generation={g.generation}
              x={layout.offsetX + g.x - g.width / 2}
              y={g.y}
              width={g.width}
            />
          ))}

          {nodes.map((node) => {
            const pos = layout.positions[String(node.id)];
            if (!pos) return null;
            const id = String(node.id);
            const childCount = childrenOf.get(id)?.length ?? 0;

            return (
              <TreeNode
                key={id}
                node={node}
                x={layout.offsetX + pos.x - pos.width / 2}
                y={pos.y}
                width={pos.width}
                height={pos.height}
                selected={selectedId === id}
                collapsed={collapsed.has(id)}
                hasChildren={childCount > 0}
                onPress={onSelectNode}
                onToggleCollapse={onToggleCollapse}
                showNickname={showNicknames !== false}
                large={largeNodes}
              />
            );
          })}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export const TreeCanvas = memo(forwardRef(TreeCanvasComponent));

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  canvas: { position: 'relative' },
});
