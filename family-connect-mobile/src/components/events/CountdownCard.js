import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

function CountdownCardComponent({ label, value, compact, light }) {
  const { colors, layout, radii } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: light ? 'rgba(255,255,255,0.15)' : colors.primarySubtle,
          borderRadius: radii.lg,
          borderColor: light ? 'rgba(255,255,255,0.2)' : colors.border,
        },
        compact && styles.compact,
      ]}
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={{ color: light ? 'rgba(255,255,255,0.8)' : colors.textSecondary, fontSize: 11 * layout.fontScale }}>
        {label}
      </Text>
      <Text
        style={{
          color: light ? '#fff' : colors.primary,
          fontFamily: 'Inter_700Bold',
          fontSize: (compact ? 16 : 22) * layout.fontScale,
          marginTop: 2,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export const CountdownCard = memo(CountdownCardComponent);

const styles = StyleSheet.create({
  wrap: { padding: 14, borderWidth: StyleSheet.hairlineWidth, alignSelf: 'flex-start' },
  compact: { paddingHorizontal: 12, paddingVertical: 8 },
});
