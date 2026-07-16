import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, PageHeader, Screen, useToast } from '../../design-system';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n';
import { useTheme } from '../../hooks/useTheme';
import { OtpInput } from '../../components/auth/OtpInput';
import { setup2FA, verify2FA, disable2FA } from '../../services/authService';

export default function SecurityScreen({ navigation }) {
  const { colors, layout } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const { user, setUser } = useAuth();

  const twoFactorEnabled = Boolean(user?.twoFactorEnabled);

  // 'idle' | 'setup' (secret shown, waiting for first code) | 'disable'
  const [step, setStep] = useState('idle');
  const [secret, setSecret] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleStartSetup() {
    setLoading(true);
    try {
      const data = await setup2FA();
      setSecret(data.secret);
      setOtpauthUrl(data.otpauthUrl ?? '');
      setStep('setup');
    } catch (e) {
      toast.error(e.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleCopySecret() {
    await Clipboard.setStringAsync(secret);
    toast.success(t('security.secretCopied'));
  }

  async function handleVerify() {
    if (code.length < 6) {
      toast.error(t('security.enterFullCode'));
      return;
    }
    setLoading(true);
    try {
      await verify2FA(code);
      setUser({ ...user, twoFactorEnabled: true });
      toast.success(t('security.enabled'));
      setStep('idle');
      setCode('');
      setSecret('');
      setOtpauthUrl('');
    } catch (e) {
      toast.error(e.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    if (code.length < 6) {
      toast.error(t('security.enterFullCode'));
      return;
    }
    setLoading(true);
    try {
      await disable2FA(code);
      setUser({ ...user, twoFactorEnabled: false });
      toast.success(t('security.disabled'));
      setStep('idle');
      setCode('');
    } catch (e) {
      toast.error(e.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen edges={['top']}>
      <PageHeader title={t('security.title')} subtitle={t('security.subtitle')} onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Card>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIcon,
                { backgroundColor: twoFactorEnabled ? colors.successMuted ?? colors.primarySubtle : colors.border },
              ]}
            >
              <Ionicons
                name={twoFactorEnabled ? 'shield-checkmark' : 'shield-outline'}
                size={24}
                color={twoFactorEnabled ? colors.success ?? colors.primary : colors.textSecondary}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 16 * layout.fontScale }}>
                {t('security.twoFactor')}
              </Text>
              <Text style={{ color: colors.textSecondary, marginTop: 2, fontSize: 13 * layout.fontScale }}>
                {twoFactorEnabled ? t('security.statusOn') : t('security.statusOff')}
              </Text>
            </View>
          </View>

          {step === 'idle' && !twoFactorEnabled ? (
            <Button
              title={t('security.enable')}
              onPress={handleStartSetup}
              loading={loading}
              style={{ marginTop: 16 }}
            />
          ) : null}

          {step === 'idle' && twoFactorEnabled ? (
            <Button
              title={t('security.disable')}
              variant="danger"
              onPress={() => {
                setCode('');
                setStep('disable');
              }}
              style={{ marginTop: 16 }}
            />
          ) : null}
        </Card>

        {step === 'setup' ? (
          <Card style={{ marginTop: 16 }}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 15 * layout.fontScale }}>
              {t('security.setupStep1')}
            </Text>
            <Text
              selectable
              accessibilityLabel={t('security.secretKey')}
              style={{
                color: colors.primary,
                fontFamily: 'Inter_700Bold',
                fontSize: 18 * layout.fontScale,
                letterSpacing: 1.5,
                marginVertical: 12,
              }}
            >
              {secret}
            </Text>
            <Button title={t('security.copySecret')} variant="secondary" onPress={handleCopySecret} />

            <Text
              style={{
                color: colors.text,
                fontFamily: 'Inter_600SemiBold',
                fontSize: 15 * layout.fontScale,
                marginTop: 20,
                marginBottom: 12,
              }}
            >
              {t('security.setupStep2')}
            </Text>
            <OtpInput value={code} onChangeText={setCode} length={6} />
            <Button
              title={t('security.verifyEnable')}
              onPress={handleVerify}
              loading={loading}
              disabled={loading}
              style={{ marginTop: 16 }}
            />
            <Button
              title={t('common.cancel')}
              variant="outline"
              onPress={() => {
                setStep('idle');
                setCode('');
              }}
              style={{ marginTop: 10 }}
            />
          </Card>
        ) : null}

        {step === 'disable' ? (
          <Card style={{ marginTop: 16 }}>
            <Text
              style={{
                color: colors.text,
                fontFamily: 'Inter_600SemiBold',
                fontSize: 15 * layout.fontScale,
                marginBottom: 12,
              }}
            >
              {t('security.disablePrompt')}
            </Text>
            <OtpInput value={code} onChangeText={setCode} length={6} />
            <Button
              title={t('security.confirmDisable')}
              variant="danger"
              onPress={handleDisable}
              loading={loading}
              disabled={loading}
              style={{ marginTop: 16 }}
            />
            <Button
              title={t('common.cancel')}
              variant="outline"
              onPress={() => {
                setStep('idle');
                setCode('');
              }}
              style={{ marginTop: 10 }}
            />
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 24 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
