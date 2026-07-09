import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

function TreeMiniMapComponent({ layout, selectedId, width = 100, height = 72 }) {
  const { colors, radii } = useTheme();
  if (!layout?.positions) return null;

  const positions = Object.entries(layout.positions);
  const scaleX = width / (layout.canvasWidth || 1);
  const scaleY = height / (layout.canvasHeight || 1);
  const scale = Math.min(scaleX, scaleY) * 0.85;

  return (
    <View
      style={[
        styles.wrap,
        {
          width,
          height,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radii.md,
        },
      ]}
      accessibilityLabel="Tree minimap overview"
    >
      {positions.map(([id, pos]) => (
        <View
          key={id}
          style={{
            position: 'absolute',
            left: (layout.offsetX + pos.x) * scale,
            top: pos.y * scale,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: selectedId === id ? colors.primary : colors.textTertiary,
          }}
        />
      ))}
    </View>
  );
}

export const TreeMiniMap = memo(TreeMiniMapComponent);

const styles = StyleSheet.create({
  wrap: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', padding: 4 },
});
