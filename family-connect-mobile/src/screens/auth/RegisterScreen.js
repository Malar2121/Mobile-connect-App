import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  GradientBackground,
  Screen,
  TextField,
  useDialog,
  useToast,
  GlassCard,
} from '../../design-system';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function RegisterScreen({ navigation }) {
  const { colors, layout } = useTheme();
  const { isTablet } = useResponsive();
  const toast = useToast();
  const dialog = useDialog();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister() {
    setError('');
    const n = name.trim();
    const em = email.trim();
    if (!n || !em || !password) {
      setError('Please fill in name, email, and password.');
      return;
    }
    const passwordRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (password.length < 8 || !passwordRegex.test(password)) {
      setError('Password must be at least 8 characters and include a special character.');
      return;
    }
    setLoading(true);
    try {
      await signUp(n, em, password);
      toast.success('Account created successfully');
      const go = await dialog.confirm({
        title: 'Account created',
        message: 'You can sign in now with your new credentials.',
        confirmLabel: 'Sign in',
        cancelLabel: 'Later',
      });
      if (go) navigation.navigate('Login');
    } catch (e) {
      const msg = e.message || 'Registration failed.';
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
                  <Ionicons name="person-add" size={32} color={colors.primary} />
                </View>
                <Text
                  style={[
                    styles.title,
                    { color: colors.text, fontSize: layout.fontScale * 38, fontFamily: 'Inter_900Black', letterSpacing: -1 },
                  ]}
                >
                  Join your family
                </Text>
                <Text style={[styles.sub, { color: colors.textSecondary, fontSize: 15 * layout.fontScale }]}>
                  Create an account to connect
                </Text>
              </View>

              {error ? (
                <View style={[styles.errorBox, { backgroundColor: colors.errorMuted }]}>
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </View>
              ) : null}

              <TextField label="Name" value={name} onChangeText={setName} placeholder="Alex" />
              <TextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                hint="At least 8 chars & 1 special character"
              />
              <Button
                title="Create account"
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
                  Already have an account?{' '}
                  <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold' }}>Sign in</Text>
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
