import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

function TreeControlsComponent({ onZoomIn, onZoomOut, onReset, onFit }) {
  const { colors, layout, radii } = useTheme();

  const btn = (icon, label, onPress) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radii.lg,
          minWidth: layout.minTouch,
          minHeight: layout.minTouch,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={20} color={colors.text} />
    </Pressable>
  );

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {btn('add-outline', 'Zoom in', onZoomIn)}
      {btn('remove-outline', 'Zoom out', onZoomOut)}
      {btn('scan-outline', 'Fit tree', onFit)}
      {btn('refresh-outline', 'Reset view', onReset)}
    </View>
  );
}

export const TreeControls = memo(TreeControlsComponent);

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 12, bottom: 12, gap: 8 },
  btn: {
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
});
