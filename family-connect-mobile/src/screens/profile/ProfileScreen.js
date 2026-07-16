import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import {
  Avatar,
  Button,
  Card,
  Chip,
  Loader,
  PageHeader,
  Screen,
  SectionTitle,
  useToast,
} from '../../design-system';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { useI18n, SUPPORTED_LOCALES } from '../../i18n';
import { useTheme } from '../../hooks/useTheme';
import { useAccessibilityPolicy } from '../../hooks/useAccessibilityPolicy';
import { createInviteCode } from '../../services/familyService';

export default function ProfileScreen({ navigation }) {
  const { colors, layout, uiMode, setUiMode, themePreference, setThemePreference } = useTheme();
  const { t, locale } = useI18n();
  const policy = useAccessibilityPolicy();
  const toast = useToast();
  const { user, signOut } = useAuth();
  const { family, members, loading: familyLoading } = useFamily();
  const [copyingInvite, setCopyingInvite] = useState(false);

  const isAdmin = user?.role === 'admin';
  const hasFamily = Boolean(family);
  const memberCount = members.length;
  const inviteCode = family?.inviteCode ?? '';
  const currentLanguage = SUPPORTED_LOCALES.find((l) => l.id === locale)?.nativeLabel ?? 'English';

  const UI_MODES = [
    { id: 'standard', label: t('profile.uiModeStandard'), icon: 'phone-portrait-outline' },
    { id: 'minor', label: t('profile.uiModeMinor'), icon: 'shield-outline' },
    { id: 'elder', label: t('profile.uiModeElder'), icon: 'accessibility-outline' },
  ];

  const THEME_OPTIONS = [
    { id: 'light', label: t('profile.themeLight') },
    { id: 'dark', label: t('profile.themeDark') },
    { id: 'system', label: t('profile.themeSystem') },
    { id: 'highContrast', label: t('profile.themeHighContrast') },
  ];

  async function handleCopyInviteCode() {
    setCopyingInvite(true);
    try {
      let code = inviteCode;
      if (!code) {
        const data = await createInviteCode();
        code = data.inviteCode;
      }
      await Clipboard.setStringAsync(code);
      toast.success(t('profile.inviteCopied'));
    } catch (e) {
      toast.error(e.message || t('common.error'));
    } finally {
      setCopyingInvite(false);
    }
  }

  const memberLabel =
    memberCount === 1 ? t('common.memberCount', { count: memberCount }) : t('common.memberCount_plural', { count: memberCount });

  return (
    <Screen edges={['top']}>
      <PageHeader title={t('profile.title')} subtitle={t('profile.subtitle')} large />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.profileRow}>
          <Avatar uri={user?.avatar} name={user?.fullName ?? 'You'} size={layout.avatarSize + 12} />
          <View style={styles.profileCopy}>
            <Text
              accessibilityRole="header"
              style={{
                color: colors.text,
                fontFamily: 'Inter_700Bold',
                fontWeight: '800',
                fontSize: 22 * layout.fontScale,
              }}
            >
              {user?.fullName ?? t('profile.yourProfile')}
            </Text>
            <Text style={{ color: colors.textSecondary, marginTop: 4, fontSize: 14 * layout.fontScale }}>
              {user?.email}
            </Text>
          </View>
        </View>

        <SectionTitle title={t('profile.family')} style={{ marginTop: layout.sectionGap }} />
        <Card>
          {familyLoading ? (
            <Loader accessibilityLabel={t('common.loading')} />
          ) : !hasFamily ? (
            <>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 16 * layout.fontScale,
                  lineHeight: 24,
                  marginBottom: 16,
                }}
              >
                {t('profile.noFamily')}
              </Text>
              <Button title={t('profile.createFamily')} onPress={() => navigation.navigate('CreateFamily')} />
              <Button
                title={t('profile.joinFamily')}
                variant="secondary"
                onPress={() => navigation.navigate('JoinFamily')}
                style={{ marginTop: 10 }}
              />
            </>
          ) : (
            <>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: 'Inter_700Bold',
                  fontWeight: '800',
                  fontSize: 20 * layout.fontScale,
                }}
              >
                {family.name}
              </Text>
              <Text style={{ color: colors.textSecondary, marginTop: 6, fontSize: 14 * layout.fontScale }}>
                {memberLabel}
              </Text>
              <Button
                title={t('profile.openFamilyHub')}
                onPress={() => navigation.navigate('FamilyModule', { screen: 'FamilyHome' })}
                style={{ marginTop: 16 }}
              />
              {policy.canPerformAdminAction ? (
                <View style={{ marginTop: 20 }}>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontFamily: 'Inter_600SemiBold',
                      marginBottom: 8,
                      fontSize: 13 * layout.fontScale,
                    }}
                  >
                    {t('profile.inviteCode')}
                  </Text>
                  {inviteCode ? (
                    <Text
                      accessibilityLabel={`${t('profile.inviteCode')} ${inviteCode}`}
                      style={{
                        color: colors.primary,
                        fontFamily: 'Inter_700Bold',
                        fontSize: 20 * layout.fontScale,
                        letterSpacing: 2,
                        marginBottom: 12,
                      }}
                    >
                      {inviteCode}
                    </Text>
                  ) : null}
                  <Button
                    title={t('profile.copyInviteCode')}
                    variant="secondary"
                    onPress={handleCopyInviteCode}
                    loading={copyingInvite}
                  />
                </View>
              ) : null}
            </>
          )}
        </Card>

        <SectionTitle title={t('profile.language')} subtitle={t('profile.languageSubtitle')} style={{ marginTop: layout.sectionGap }} />
        <Card>
          <Button
            title={currentLanguage}
            variant="secondary"
            onPress={() => navigation.navigate('Language')}
            iconRight={<Ionicons name="chevron-forward" size={18} color={colors.primary} />}
            accessibilityLabel={`${t('profile.language')}: ${currentLanguage}`}
            accessibilityHint={t('profile.languageSubtitle')}
          />
        </Card>

        <SectionTitle title={t('profile.appearance')} style={{ marginTop: layout.sectionGap }} />
        <Card>
          <Text style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale, marginBottom: 12 }}>
            {t('profile.theme')}
          </Text>
          <View style={styles.chipRow}>
            {THEME_OPTIONS.map((opt) => (
              <Chip
                key={opt.id}
                label={opt.label}
                selected={themePreference === opt.id}
                onPress={() => setThemePreference(opt.id)}
                accessibilityLabel={opt.label}
                accessibilityState={{ selected: themePreference === opt.id }}
              />
            ))}
          </View>
        </Card>

        <SectionTitle title={t('profile.accessibility')} subtitle={t('profile.accessibilitySubtitle')} />
        <Card>
          <View style={styles.chipRow}>
            {UI_MODES.map((mode) => (
              <Chip
                key={mode.id}
                label={mode.label}
                selected={uiMode === mode.id}
                onPress={() => setUiMode(mode.id)}
                accessibilityLabel={mode.label}
                accessibilityState={{ selected: uiMode === mode.id }}
                icon={
                  <Ionicons
                    name={mode.icon}
                    size={14}
                    color={uiMode === mode.id ? colors.textInverse : colors.primary}
                  />
                }
              />
            ))}
          </View>
          {uiMode === 'elder' ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale, marginTop: 12 }}>
              {t('profile.elderHint')}
            </Text>
          ) : null}
          {uiMode === 'minor' ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale, marginTop: 12 }}>
              {t('profile.minorHint')}
            </Text>
          ) : null}
        </Card>

        <SectionTitle title={t('security.title')} subtitle={t('security.subtitle')} style={{ marginTop: layout.sectionGap }} />
        <Card>
          <Button
            title={t('security.twoFactor')}
            variant="secondary"
            onPress={() => navigation.navigate('Security')}
            icon={<Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />}
            iconRight={<Ionicons name="chevron-forward" size={18} color={colors.primary} />}
            accessibilityLabel={t('security.twoFactor')}
            accessibilityHint={t('security.subtitle')}
          />
        </Card>

        <Button
          title={t('profile.notificationsInbox')}
          variant="secondary"
          onPress={() => navigation.navigate('Notifications')}
          style={{ marginTop: layout.sectionGap }}
          icon={<Ionicons name="notifications-outline" size={20} color={colors.primary} />}
        />
        <Button
          title={t('auth.signOut')}
          variant="danger"
          onPress={signOut}
          style={{ marginTop: 12, marginBottom: 32 }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 24 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  profileCopy: { marginLeft: 16, flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
