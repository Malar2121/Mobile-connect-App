import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView from 'react-native-maps';
import { useTheme } from '../../hooks/useTheme';
import { fitRegionToLocations } from '../../utils/locationHelpers';

function MiniMapCardComponent({ locations, height = 140 }) {
  const { colors, isDark } = useTheme();
  if (!locations?.length) return null;
  const region = fitRegionToLocations(locations);

  return (
    <View style={[styles.wrap, { height, borderColor: colors.border, backgroundColor: colors.surface }]}>
      <MapView style={StyleSheet.absoluteFill} region={region} scrollEnabled={false} zoomEnabled={false} userInterfaceStyle={isDark ? 'dark' : 'light'} />
    </View>
  );
}

export const MiniMapCard = memo(MiniMapCardComponent);

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, marginBottom: 16 },
});
