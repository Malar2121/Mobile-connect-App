import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Avatar } from '../Avatar';
import { DashboardGlassCard } from './DashboardGlassCard';
import { DashboardPressable } from './DashboardPressable';
import { useTheme } from '../../hooks/useTheme';
import {
  dashboardGradients,
  dashboardSpacing,
  dashboardTypography,
} from '../../constants/dashboardTheme';

const AVATAR_SIZE = 48;
const AVATAR_OVERLAP = 14;

export function DashboardFamilyCard({
  members,
  memberCount,
  onlineCount,
  inviteCode,
  onInvite,
  onManage,
  inviting,
}) {
  const { colors, isDark } = useTheme();
  const gradients = dashboardGradients(isDark);
  const visible = members.slice(0, 5);
  const extra = Math.max(0, members.length - visible.length);

  async function handleInvite() {
    if (onInvite) {
      onInvite();
      return;
    }
    if (inviteCode) {
      await Clipboard.setStringAsync(inviteCode);
      Alert.alert('Copied', 'Invite code copied to clipboard.');
    }
  }

  return (
    <Animated.View entering={FadeInDown.delay(80).duration(520).springify()}>
      <DashboardGlassCard>
        <View style={styles.avatarRow}>
          {visible.map((member, index) => (
            <View
              key={String(member._id)}
              style={[
                styles.avatarWrap,
                {
                  marginLeft: index === 0 ? 0 : -AVATAR_OVERLAP,
                  zIndex: visible.length - index,
                  borderColor: isDark ? colors.card : '#fff',
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
                  marginLeft: -AVATAR_OVERLAP,
                  backgroundColor: isDark ? 'rgba(129,140,248,0.25)' : 'rgba(99,102,241,0.12)',
                  borderColor: isDark ? colors.card : '#fff',
                },
              ]}
            >
              <Text style={{ color: colors.primary, fontFamily: dashboardTypography.fontSemi, fontSize: 13 }}>
                +{extra}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaBlock}>
            <Text style={[styles.metaValue, { color: colors.text, fontFamily: dashboardTypography.fontBold }]}>
              {memberCount}
            </Text>
            <Text style={[styles.metaLabel, { color: colors.textSecondary, fontFamily: dashboardTypography.fontRegular }]}>
              Members
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.metaBlock}>
            <Text style={[styles.metaValue, { color: colors.success, fontFamily: dashboardTypography.fontBold }]}>
              {onlineCount}
            </Text>
            <Text style={[styles.metaLabel, { color: colors.textSecondary, fontFamily: dashboardTypography.fontRegular }]}>
              Online
            </Text>
          </View>
          {inviteCode ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={[styles.metaBlock, { flex: 1 }]}>
                <Text
                  style={[styles.code, { color: colors.primary, fontFamily: dashboardTypography.fontSemi }]}
                  numberOfLines={1}
                >
                  {inviteCode}
                </Text>
                <Text style={[styles.metaLabel, { color: colors.textSecondary, fontFamily: dashboardTypography.fontRegular }]}>
                  Invite code
                </Text>
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.actions}>
          <DashboardPressable onPress={handleInvite} style={styles.actionFlex}>
            <LinearGradient colors={gradients.cardAccent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGradient}>
              <Ionicons name="person-add-outline" size={18} color="#fff" />
              <Text style={styles.btnLightText}>{inviting ? 'Copying…' : 'Invite'}</Text>
            </LinearGradient>
          </DashboardPressable>
          <DashboardPressable onPress={onManage} style={styles.actionFlex}>
            <View
              style={[
                styles.btnOutline,
                {
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(99,102,241,0.2)',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.06)',
                },
              ]}
            >
              <Ionicons name="people-outline" size={18} color={colors.primary} />
              <Text style={[styles.btnDarkText, { color: colors.primary, fontFamily: dashboardTypography.fontSemi }]}>
                Manage
              </Text>
            </View>
          </DashboardPressable>
        </View>
      </DashboardGlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dashboardSpacing.md,
  },
  avatarWrap: {
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
  },
  moreBadge: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dashboardSpacing.md,
  },
  metaBlock: {
    alignItems: 'center',
    minWidth: 72,
  },
  metaValue: {
    fontSize: 20,
    letterSpacing: -0.3,
  },
  metaLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  code: {
    fontSize: 15,
    letterSpacing: 1,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    marginHorizontal: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionFlex: {
    flex: 1,
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 20,
  },
  btnLightText: {
    color: '#fff',
    fontFamily: dashboardTypography.fontSemi,
    fontSize: 15,
  },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  btnDarkText: {
    fontSize: 15,
  },
});
