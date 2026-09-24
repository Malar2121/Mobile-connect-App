import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  Chip,
  GradientBackground,
  Screen,
  TextField,
  useDialog,
  useToast,
  GlassCard,
} from '../../design-system';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';
import { useResponsive } from '../../design-system';

export default function RegisterScreen({ navigation }) {
  const { colors, layout } = useTheme();
  const { t } = useI18n();
  const { isTablet } = useResponsive();
  const toast = useToast();
  const dialog = useDialog();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [memberType, setMemberType] = useState('adult');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const MEMBER_TYPES = [
    { id: 'adult', label: t('auth.memberAdult'), icon: 'person-outline' },
    { id: 'child', label: t('auth.memberChild'), icon: 'shield-outline' },
    { id: 'elder', label: t('auth.memberElder'), icon: 'accessibility-outline' },
  ];

  async function handleRegister() {
    setError('');
    const n = name.trim();
    const em = email.trim();
    if (!n || !em || !password) {
      setError(t('auth.fillAllFields'));
      return;
    }
    const passwordRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (password.length < 8 || !passwordRegex.test(password)) {
      setError(t('auth.passwordRule'));
      return;
    }
    setLoading(true);
    try {
      await signUp(n, em, password, memberType);
      toast.success(t('auth.accountCreated'));
      const go = await dialog.confirm({
        title: t('auth.accountCreated2'),
        message: t('auth.youCanSignInNowWith'),
        confirmLabel: t('auth.signIn'),
        cancelLabel: t('auth.later'),
      });
      if (go) navigation.navigate('Login');
    } catch (e) {
      const msg = e.message || t('auth.registrationFailed');
      setError(msg);
      if (e.status >= 500) toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <GradientBackground variant="auth">
      <Screen edges={['top', 'bottom']} style={{ backgroundColor: 'transparent' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <View style={[styles.inner, isTablet && styles.innerTablet]}>
            <GlassCard noPadding={false} intensity={80}>
              <View style={[styles.brandRow, { marginBottom: layout.sectionGap * 1.2 }]}>
                <View style={[styles.logoRing, { backgroundColor: colors.primarySubtle }]}>
                  <Image
                    source={require('../../../assets/logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text
                  style={[
                    styles.title,
                    { color: colors.text, fontSize: layout.fontScale * 38, fontFamily: 'Inter_900Black', letterSpacing: -1 },
                  ]}
                >
                  {t('auth.joinYourFamily')}
                </Text>
                <Text style={[styles.sub, { color: colors.textSecondary, fontSize: 15 * layout.fontScale }]}>
                  {t('auth.createAccountToConnect')}
                </Text>
              </View>

              {error ? (
                <View style={[styles.errorBox, { backgroundColor: colors.errorMuted }]}>
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </View>
              ) : null}

              <TextField label={t('auth.name')} value={name} onChangeText={setName} placeholder={t('auth.alex')} />
              <TextField
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextField
                label={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                hint={t('auth.passwordHint')}
              />
              <Text style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale, marginBottom: 8 }}>
                {t('auth.iAmA')}
              </Text>
              <View style={styles.chipRow}>
                {MEMBER_TYPES.map((type) => (
                  <Chip
                    key={type.id}
                    label={type.label}
                    selected={memberType === type.id}
                    onPress={() => setMemberType(type.id)}
                    accessibilityLabel={type.label}
                    accessibilityState={{ selected: memberType === type.id }}
                    icon={
                      <Ionicons
                        name={type.icon}
                        size={14}
                        color={memberType === type.id ? colors.textInverse : colors.primary}
                      />
                    }
                  />
                ))}
              </View>
              <Button
                title={t('auth.createAccount')}
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                size="lg"
                style={styles.cta}
              />
              <Pressable
                onPress={() => navigation.goBack()}
                style={styles.linkWrap}
                disabled={loading}
                accessibilityRole="link"
              >
                <Text style={{ color: colors.textSecondary, fontSize: 15 * layout.fontScale }}>
                  {t('auth.haveAccount')}{' '}
                  <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold' }}>{t('auth.signIn')}</Text>
                </Text>
              </Pressable>
            </GlassCard>
          </View>
        </KeyboardAvoidingView>
      </Screen>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'center' },
  inner: { flex: 1, justifyContent: 'center', maxWidth: 440, width: '100%', alignSelf: 'center' },
  innerTablet: { paddingVertical: 40 },
  brandRow: { alignItems: 'center' },
  logoRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  logoImage: {
    width: 56,
    height: 56,
  },
  title: { fontFamily: 'Inter_700Bold', fontWeight: '800', textAlign: 'center' },
  sub: { textAlign: 'center', lineHeight: 22, marginTop: 8 },
  errorBox: { borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 14, lineHeight: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  cta: { marginTop: 8 },
  linkWrap: { marginTop: 24, alignItems: 'center' },
});
