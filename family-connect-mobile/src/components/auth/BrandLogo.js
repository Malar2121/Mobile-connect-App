import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

/**
 * App logo shown at the top of the auth screens — a white rounded tile
 * (app-icon style) holding the trimmed logo so the wordmark is never cropped.
 */
export function BrandLogo({ size = 104, style }) {
  const { colors } = useTheme();
  const inset = Math.round(size * 0.1);

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Family Connect"
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size * 0.26,
          padding: inset,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Image source={require('../../../assets/logo-mark.png')} style={styles.image} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },
  image: { width: '100%', height: '100%' },
});
