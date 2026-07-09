import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

function LegacyCardComponent({ profile, member, memoryCount, onPress }) {
  const { colors, layout, radii, isDark } = useTheme();
  const name = profile?.displayName ?? member?.fullName ?? 'Beloved family member';

  return (
    <Pressable onPress={() => onPress?.(profile, member)} style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1, marginBottom: 16 }]}>
      <LinearGradient
        colors={isDark ? ['#1A1528', '#2D2640', '#14141C'] : ['#FDF4FF', '#F3E8FF', '#FFFFFF']}
        style={[styles.wrap, { borderRadius: radii['2xl'], borderColor: colors.border }]}
      >
        <View style={[styles.badge, { backgroundColor: colors.primary + '22', borderRadius: radii.full }]}>
          <Ionicons name="heart" size={12} color={colors.primary} />
          <Text style={{ color: colors.primary, fontSize: 11, fontFamily: 'Inter_600SemiBold', marginLeft: 4 }}>In loving memory</Text>
        </View>
        <Avatar uri={member?.avatar ?? profile?.photoUri} name={name} size={layout.avatarSize + 24} />
        <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 22 * layout.fontScale, marginTop: 14, textAlign: 'center' }}>
          {name}
        </Text>
        {profile?.years ? (
          <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 6, fontStyle: 'italic' }}>
            {profile.years}
          </Text>
        ) : null}
        {profile?.story ? (
          <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginTop: 12, textAlign: 'center', lineHeight: 22 }} numberOfLines={3}>
            &ldquo;{profile.story}&rdquo;
          </Text>
        ) : null}
        <View style={styles.stats}>
          <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{memoryCount} memories preserved</Text>
        </View>
        <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', marginTop: 12, fontSize: 14 }}>View remembrance →</Text>
      </LinearGradient>
    </Pressable>
  );
}

export const LegacyCard = memo(LegacyCardComponent);

const styles = StyleSheet.create({
  wrap: { padding: 24, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, marginBottom: 8 },
  stats: { marginTop: 16 },
});
