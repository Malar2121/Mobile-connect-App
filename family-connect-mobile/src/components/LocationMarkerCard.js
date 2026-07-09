import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { useTheme } from '../hooks/useTheme';
import { formatLastActive } from '../utils/locationHelpers';

export function LocationMarkerCard({ location, onClose, isElder }) {
  const { colors, layout } = useTheme();

  if (!location) return null;

  const name = location.user?.fullName ?? 'Family member';
  const titleSize = (isElder ? 20 : 17) * layout.fontScale;
  const bodySize = (isElder ? 15 : 14) * layout.fontScale;
  const metaSize = (isElder ? 13 : 12) * layout.fontScale;
  const avatarSize = isElder ? 56 : 48;
  const pad = isElder ? layout.sectionGap + 4 : layout.sectionGap;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          marginHorizontal: layout.sectionGap,
          padding: pad,
        },
      ]}
    >
      <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
        <Ionicons name="close" size={isElder ? 26 : 22} color={colors.textSecondary} />
      </Pressable>

      <View style={styles.header}>
        <Avatar uri={location.user?.avatar} name={name} size={avatarSize} />
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: titleSize }}>{name}</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 4, fontSize: metaSize }}>
            Last active · {formatLastActive(location.updatedAt)}
          </Text>
        </View>
      </View>

      <View style={[styles.coordsBlock, { borderTopColor: colors.border, marginTop: pad }]}>
        <Text style={{ color: colors.textSecondary, fontSize: metaSize, fontWeight: '600' }}>
          COORDINATES
        </Text>
        <Text style={{ color: colors.text, marginTop: 8, fontSize: bodySize, fontWeight: '600' }}>
          {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
        </Text>
        <Text style={{ color: colors.textSecondary, marginTop: 6, fontSize: metaSize }}>
          Latitude {location.latitude.toFixed(6)}
        </Text>
        <Text style={{ color: colors.textSecondary, marginTop: 2, fontSize: metaSize }}>
          Longitude {location.longitude.toFixed(6)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  close: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 28,
  },
  coordsBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
  },
});
