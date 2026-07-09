import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

function FamilyStatCardComponent({ label, value, icon, onPress, accent }) {
  const { colors, layout, radii, shadows } = useTheme();

  const content = (
    <View
      style={[
        styles.wrap,
        shadows.sm,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radii.xl,
          minHeight: layout.minTouch + 24,
        },
      ]}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${label}: ${value}`}
    >
      {icon ? (
        <View style={[styles.icon, { backgroundColor: colors.primarySubtle, borderRadius: radii.md }]}>
          <Ionicons name={icon} size={20} color={accent ?? colors.primary} />
        </View>
      ) : null}
      <Text
        style={{
          color: accent ?? colors.text,
          fontFamily: 'Inter_700Bold',
          fontSize: 22 * layout.fontScale,
          marginTop: icon ? 10 : 0,
        }}
      >
        {value}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12 * layout.fontScale, marginTop: 4 }}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.9 : 1 }]}>
        {content}
      </Pressable>
    );
  }
  return <View style={{ flex: 1 }}>{content}</View>;
}

export const FamilyStatCard = memo(FamilyStatCardComponent);

const styles = StyleSheet.create({
  wrap: { padding: 16, borderWidth: StyleSheet.hairlineWidth, flex: 1 },
  icon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
