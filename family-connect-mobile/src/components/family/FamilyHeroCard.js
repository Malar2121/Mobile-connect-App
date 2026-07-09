import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Avatar, GlassCard } from '../../design-system';
import { MemberAvatarStack } from './MemberAvatarStack';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

function FamilyHeroCardComponent({
  familyName,
  motto,
  createdAt,
  inviteCode,
  members,
  memberCount,
  onlineCount,
  pendingRequests,
  onInvite,
  onSettings,
}) {
  const { colors, isDark, gradients, layout, radii, shadows } = useTheme();
  const { horizontalPadding, isTablet } = useResponsive();

  const createdLabel = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : null;

  return (
    <Animated.View
      entering={FadeInDown.duration(480).springify()}
      style={{ paddingHorizontal: horizontalPadding, marginBottom: layout.sectionGap }}
      accessibilityRole="summary"
      accessibilityLabel={`${familyName} family overview. ${memberCount} members, ${onlineCount} online.`}
    >
      <View style={[shadows.lg, { borderRadius: radii['2xl'], overflow: 'hidden' }]}>
        <LinearGradient
          colors={isDark ? ['#1A1D3D', '#2A2D5C', '#14141C'] : ['#EEF0FF', '#F5F6FA', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <GlassCard noPadding borderless intensity={isDark ? 40 : 64}>
            <View style={[styles.inner, isTablet && styles.innerTablet]}>
              <View style={styles.topRow}>
                <View style={[styles.familyIcon, { backgroundColor: colors.primarySubtle }]}>
                  <Ionicons name="home" size={28} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 26 * layout.fontScale,
                      fontFamily: 'Inter_700Bold',
                      letterSpacing: -0.5,
                    }}
                  >
                    {familyName}
                  </Text>
                  {motto ? (
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 14 * layout.fontScale,
                        marginTop: 4,
                        fontStyle: 'italic',
                      }}
                      numberOfLines={2}
                    >
                      &ldquo;{motto}&rdquo;
                    </Text>
                  ) : null}
                  {createdLabel ? (
                    <Text style={{ color: colors.textTertiary, fontSize: 12 * layout.fontScale, marginTop: 6 }}>
                      Est. {createdLabel}
                    </Text>
                  ) : null}
                </View>
              </View>

              <MemberAvatarStack members={members} style={{ marginTop: 18 }} />

              <View style={styles.statsRow}>
                <StatPill colors={colors} layout={layout} value={memberCount} label="Members" />
                <StatPill colors={colors} layout={layout} value={onlineCount} label="Online" accent={colors.success} />
                {inviteCode ? (
                  <StatPill colors={colors} layout={layout} value={inviteCode} label="Invite code" accent={colors.primary} mono />
                ) : null}
                {pendingRequests > 0 ? (
                  <StatPill colors={colors} layout={layout} value={pendingRequests} label="Requests" accent={colors.warning} />
                ) : null}
              </View>

              <View style={styles.actions}>
                <ActionBtn
                  label="Invite"
                  icon="person-add-outline"
                  primary
                  gradients={gradients}
                  radii={radii}
                  onPress={onInvite}
                />
                <ActionBtn
                  label="Settings"
                  icon="settings-outline"
                  colors={colors}
                  radii={radii}
                  onPress={onSettings}
                />
              </View>
            </View>
          </GlassCard>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

function StatPill({ colors, layout, value, label, accent, mono }) {
  return (
    <View style={[styles.pill, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      <Text
        style={{
          color: accent ?? colors.text,
          fontFamily: 'Inter_700Bold',
          fontSize: (mono ? 14 : 18) * layout.fontScale,
          letterSpacing: mono ? 1.2 : 0,
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 10 * layout.fontScale, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function ActionBtn({ label, icon, primary, gradients, colors, radii, onPress }) {
  if (primary) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.92 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.btnPrimary, { borderRadius: radii.lg }]}
        >
          <View style={styles.btnInner}>
            <Ionicons name={icon} size={18} color="#fff" />
            <Text style={styles.btnPrimaryText}>{label}</Text>
          </View>
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btnSecondary,
        {
          borderColor: colors.borderStrong,
          backgroundColor: colors.primarySubtle,
          borderRadius: radii.lg,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={[styles.btnSecondaryText, { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

export const FamilyHeroCard = memo(FamilyHeroCardComponent);

const styles = StyleSheet.create({
  inner: { padding: 20 },
  innerTablet: { padding: 28 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start' },
  familyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 72,
    alignItems: 'center',
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btnPrimary: { flex: 1 },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  btnPrimaryText: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  btnSecondaryText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
