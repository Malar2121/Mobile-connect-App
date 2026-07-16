import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, GradientBackground, Screen, useToast, useResponsive, GlassCard } from '../../design-system';
import { useI18n } from '../../i18n';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { OtpInput } from '../../components/auth/OtpInput';

export default function TwoFactorAuthScreen({ navigation, route }) {
  const { colors, layout } = useTheme();
  const { isTablet } = useResponsive();
  const { t } = useI18n();
  const toast = useToast();

  const { completeTwoFactorSignIn } = useAuth();
  const tempToken = route?.params?.tempToken;

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleVerify() {
    if (code.length < 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }
    if (!tempToken) {
      toast.error('Your sign-in session expired. Please log in again.');
      navigation.goBack();
      return;
    }
    setLoading(true);
    try {
      // On success AuthContext gains a token and AppNavigator switches stacks
      await completeTwoFactorSignIn(tempToken, code);
      toast.success('Verification successful');
    } catch (e) {
      toast.error(e?.message || 'Invalid verification code');
      setCode('');
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
                  <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
                </View>
                <Text
                  style={[
                    styles.title,
                    { color: colors.text, fontSize: layout.fontScale * 32, fontFamily: 'Inter_900Black', letterSpacing: -1 },
                  ]}
                >
                  Verify
                </Text>
                <Text style={[styles.sub, { color: colors.textSecondary, fontSize: 15 * layout.fontScale }]}>
                  Enter the 6-digit code from your authenticator app
                </Text>
              </View>

              <OtpInput value={code} onChangeText={setCode} length={6} />
              
              <Button
                title="Verify"
                onPress={handleVerify}
                loading={loading}
                disabled={loading}
                size="lg"
                style={styles.cta}
              />
              <Button
                title="Back to Login"
                variant="outline"
                onPress={() => navigation.goBack()}
                style={{ marginTop: 16 }}
              />
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
  cta: { marginTop: 16 },
});
