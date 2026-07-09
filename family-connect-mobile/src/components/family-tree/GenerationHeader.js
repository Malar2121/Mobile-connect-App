import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getGenerationLabel } from '../../utils/familyTreeModuleHelpers';
import { useTheme } from '../../hooks/useTheme';

function GenerationHeaderComponent({ generation, x, y, width }) {
  const { colors, layout, radii } = useTheme();

  return (
    <View style={[styles.wrap, { left: x, top: y - 28, width }]}>
      <View style={[styles.pill, { backgroundColor: colors.primarySubtle, borderRadius: radii.full }]}>
        <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 11 * layout.fontScale }}>
          {getGenerationLabel(generation)}
        </Text>
      </View>
    </View>
  );
}

export const GenerationHeader = memo(GenerationHeaderComponent);

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center' },
  pill: { paddingHorizontal: 12, paddingVertical: 4 },
});
