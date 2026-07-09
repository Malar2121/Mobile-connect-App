import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';

/**
 * Dashboard stat card — Apple Health inspired metric tile.
 */
export function StatCard({
  label,
  value,
  icon,
  gradientKey = 'cool',
  trend,
  style,
}) {
  const { colors, layout, radii, shadows, gradients, isDark } = useTheme();
  const gradient = gradients[gradientKey] ?? gradients.cool;

  return (
    <View
      style={[
        styles.wrap,
        shadows.sm,
        {
          borderRadius: radii.xl,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          minHeight: layout.minTouch + 20,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={
          isDark
            ? ['rgba(79,86,217,0.15)', 'rgba(20,20,28,0.6)']
            : ['rgba(238,240,255,0.9)', 'rgba(255,255,255,0.95)']
        }
        style={[StyleSheet.absoluteFill, { borderRadius: radii.xl }]}
      />
      <View style={[styles.accent, { borderRadius: radii.sm }]}>
        <LinearGradient
          colors={gradient}
          style={[StyleSheet.absoluteFill, { borderRadius: radii.sm }]}
        />
      </View>
      <View style={styles.content}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <Text
          style={{
            color: colors.text,
            fontSize: 26 * layout.fontScale,
            fontFamily: 'Inter_700Bold',
            fontWeight: '700',
            letterSpacing: -0.5,
          }}
        >
          {value}
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 12 * layout.fontScale,
            marginTop: 2,
            fontFamily: 'Inter_500Medium',
          }}
        >
          {label}
        </Text>
        {trend ? (
          <Text style={{ color: colors.success, fontSize: 11 * layout.fontScale, marginTop: 4 }}>
            {trend}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    minWidth: 100,
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  content: {
    padding: 16,
    paddingTop: 14,
  },
  icon: { marginBottom: 8 },
});

export { StatCard as DSStatCard };
