import React, { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Avatar, GlassCard } from '../../design-system';
import { DashboardPressable } from './DashboardPressable';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';
import { useI18n } from '../../i18n';

const AVATAR_SIZE = 46;
const OVERLAP = 16;

function OnlinePulse() {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 900 }), withTiming(0.45, { duration: 900 })),
      -1,
      true,
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.pulse, { backgroundColor: colors.success }, style]} />
  );
}

function FamilyHeroCardComponent({
  familyName,
  members,
  memberCount,
  onlineCount,
  inviteCode,
  inviting,
  onInvite,
  onManage,
}) {
  const { colors, isDark, gradients, layout, radii, shadows } = useTheme();
  const { horizontalPadding, isTablet } = useResponsive();
  const { t } = useI18n();
  const visible = members.slice(0, 6);
  const extra = Math.max(0, members.length - visible.length);

  return (
    <Animated.View
      entering={FadeInDown.delay(60).duration(520).springify()}
      style={{ paddingHorizontal: horizontalPadding, marginBottom: layout.sectionGap }}
    >
      <View style={[shadows.lg, { borderRadius: radii['2xl'], overflow: 'hidden' }]}>
        <LinearGradient
          colors={isDark ? ['#1A1D3D', '#2A2D5C', '#14141C'] : ['#EEF0FF', '#F5F6FA', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <GlassCard noPadding borderless intensity={isDark ? 40 : 64}>
            <View style={[styles.inner, isTablet && styles.innerTablet]}>
              <View style={styles.avatarRow}>
                {visible.map((member, index) => (
                  <View
                    key={String(member._id)}
                    style={[
                      styles.avatarWrap,
                      {
                        marginLeft: index === 0 ? 0 : -OVERLAP,
                        zIndex: visible.length - index,
                        borderColor: isDark ? colors.surfaceElevated : colors.surface,
                      },
                    ]}
                  >
                    <Avatar uri={member.avatar} name={member.fullName} size={AVATAR_SIZE} />
                  </View>
                ))}
                {extra > 0 ? (
                  <View
                    style={[
                      styles.moreBadge,
                      {
                        marginLeft: -OVERLAP,
                        backgroundColor: colors.primarySubtle,
                        borderColor: isDark ? colors.surfaceElevated : colors.surface,
                      },
                    ]}
                  >
                    <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 13 }}>
                      +{extra}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text
                style={{
                  color: colors.text,
                  fontSize: layout.fontScale * 38,
                  lineHeight: layout.fontScale * 42,
                  fontFamily: 'Inter_900Black', // Fallback to Bold if Black isn't loaded, but styling implies extra heavy weight
                  fontWeight: '900',
                  letterSpacing: -1.5,
                  marginTop: 20,
                  marginBottom: 4,
                }}
              >
                {familyName}
              </Text>

              <Text style={{ color: colors.textSecondary, fontSize: 15, fontFamily: 'Inter_500Medium', marginBottom: 20 }}>
                {t('dashboard.membersOnline', { members: memberCount, online: onlineCount })}
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{memberCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('common.members')}</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.stat}>
                  <View style={styles.onlineRow}>
                    <OnlinePulse />
                    <Text style={[styles.statValue, { color: colors.success }]}>{onlineCount}</Text>
                  </View>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('dashboard.onlineNow')}</Text>
                </View>
                {inviteCode ? (
                  <>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={[styles.stat, { flex: 1 }]}>
                      <Text
                        style={[styles.statValue, { color: colors.primary, letterSpacing: 1.5, fontSize: 16 }]}
                        numberOfLines={1}
                      >
                        {inviteCode}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('profile.inviteCode')}</Text>
                    </View>
                  </>
                ) : null}
              </View>

              <View style={styles.actions}>
                <DashboardPressable onPress={onInvite} style={styles.actionBtn}>
                  <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.btnPrimary, { borderRadius: radii.lg }]}
                  >
                    <Ionicons name="person-add-outline" size={18} color="#fff" />
                    <Text style={styles.btnPrimaryText}>{inviting ? t('dashboard.copying') : t('dashboard.quickInvite')}</Text>
                  </LinearGradient>
                </DashboardPressable>
                <DashboardPressable onPress={onManage} style={styles.actionBtn}>
                  <View
                    style={[
                      styles.btnSecondary,
                      {
                        borderColor: colors.borderStrong,
                        backgroundColor: colors.primarySubtle,
                        borderRadius: radii.lg,
                      },
                    ]}
                  >
                    <Ionicons name="people-outline" size={18} color={colors.primary} />
                    <Text style={[styles.btnSecondaryText, { color: colors.primary }]}>{t('dashboard.manage')}</Text>
                  </View>
                </DashboardPressable>
              </View>
            </View>
          </GlassCard>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

export const FamilyHeroCard = memo(FamilyHeroCardComponent);

const styles = StyleSheet.create({
  heroGradient: { borderRadius: 28 },
  inner: { padding: 20 },
  innerTablet: { padding: 28 },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { borderRadius: 24, borderWidth: 3 },
  moreBadge: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  stat: { alignItems: 'center', minWidth: 72 },
  statValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, marginTop: 2, fontFamily: 'Inter_500Medium' },
  statDivider: { width: StyleSheet.hairlineWidth, height: 36, marginHorizontal: 10 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulse: { width: 8, height: 8, borderRadius: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  actionBtn: { flex: 1 },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  btnPrimaryText: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  btnSecondaryText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
