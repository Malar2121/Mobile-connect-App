import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';

function initials(name) {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? '';
  const b = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (a + b).toUpperCase();
}

const STATUS_COLORS = {
  online: '#10B981',
  away: '#F59E0B',
  offline: '#8E92A4',
};

/**
 * Avatar with initials fallback, optional status ring, responsive sizing.
 */
export function Avatar({
  uri,
  name,
  size,
  status,
  bordered,
  accessibilityLabel,
}) {
  const { colors, layout, gradients } = useTheme();
  const resolvedSize = size ?? layout.avatarSize;
  const fontSize = Math.max(12, resolvedSize * 0.36 * layout.fontScale);
  const ringSize = resolvedSize + (status || bordered ? 6 : 0);

  const inner = uri ? (
    <Image
      source={{ uri }}
      accessibilityLabel={accessibilityLabel ?? name}
      style={[
        styles.image,
        { width: resolvedSize, height: resolvedSize, borderRadius: resolvedSize / 2 },
      ]}
    />
  ) : (
    <LinearGradient
      colors={gradients.primary}
      style={[
        styles.fallback,
        { width: resolvedSize, height: resolvedSize, borderRadius: resolvedSize / 2 },
      ]}
    >
      <Text
        style={{
          color: colors.textInverse,
          fontSize,
          fontFamily: 'Inter_700Bold',
          fontWeight: '700',
        }}
      >
        {initials(name)}
      </Text>
    </LinearGradient>
  );

  if (status || bordered) {
    return (
      <View
        style={[
          styles.ring,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderColor: status ? STATUS_COLORS[status] ?? colors.border : colors.border,
            borderWidth: status ? 2.5 : StyleSheet.hairlineWidth,
            padding: status ? 2 : 1,
          },
        ]}
      >
        {inner}
      </View>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  image: { backgroundColor: '#ccc' },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  ring: { alignItems: 'center', justifyContent: 'center' },
});

export { Avatar as DSAvatar };
