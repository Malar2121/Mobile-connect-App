import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  GradientBackground,
  Screen,
  TextField,
  useToast,
  GlassCard,
} from '../../design-system';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function LoginScreen({ navigation }) {
  const { colors, layout } = useTheme();
  const { isTablet } = useResponsive();
  const { t } = useI18n();
  const toast = useToast();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setLoading(true);
    setError('');
    try {
      const result = await signIn(email, password);
      if (result?.requires2FA) {
        navigation.navigate('TwoFactorAuth', { tempToken: result.tempToken });
      }
    } catch (e) {
      setError(e?.message || 'Login failed. Please try again.');
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
                  <Ionicons name="people" size={32} color={colors.primary} />
                </View>
                <Text
                  style={[
                    styles.title,
                    { color: colors.text, fontSize: layout.fontScale * 38, fontFamily: 'Inter_900Black', letterSpacing: -1 },
                  ]}
                >
                  {t('common.appName')}
                </Text>
                <Text style={[styles.sub, { color: colors.textSecondary, fontSize: 15 * layout.fontScale }]}>
                  {t('auth.signInSubtitle')}
                </Text>
              </View>

              {error ? (
                <View style={[styles.errorBox, { backgroundColor: colors.errorMuted }]}>
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </View>
              ) : null}

              <TextField
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.emailPlaceholder')}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextField
                label={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                placeholder={t('auth.passwordPlaceholder')}
                secureTextEntry
              />
              <Button
                title={t('auth.signIn')}
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                size="lg"
                style={styles.cta}
              />
              <Pressable
                onPress={() => navigation.navigate('Register')}
                style={styles.linkWrap}
                disabled={loading}
                accessibilityRole="link"
                accessibilityLabel={`${t('auth.noAccount')} ${t('auth.createAccount')}`}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 15 * layout.fontScale }}>
                  {t('auth.noAccount')}{' '}
                  <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold' }}>{t('auth.createAccount')}</Text>
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
  },
  title: { fontFamily: 'Inter_700Bold', fontWeight: '800', textAlign: 'center' },
  sub: { textAlign: 'center', lineHeight: 22, marginTop: 8 },
  errorBox: { borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 14, lineHeight: 20 },
  cta: { marginTop: 8 },
  linkWrap: { marginTop: 24, alignItems: 'center' },
});
