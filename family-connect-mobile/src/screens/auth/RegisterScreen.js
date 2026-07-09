import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  GradientBackground,
  PageHeader,
  Screen,
  TextField,
  useDialog,
  useToast,
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
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
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
        <PageHeader title="Join your family" onBack={() => navigation.goBack()} large />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <View style={[styles.inner, isTablet && styles.innerTablet]}>
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
              hint="At least 8 characters"
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
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 15 * layout.fontScale }}>
                Back to sign in
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Screen>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inner: { flex: 1, maxWidth: 440, width: '100%', alignSelf: 'center' },
  innerTablet: { paddingTop: 8 },
  errorBox: { borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 14, lineHeight: 20 },
  cta: { marginTop: 8 },
  linkWrap: { marginTop: 24, alignItems: 'center' },
});
