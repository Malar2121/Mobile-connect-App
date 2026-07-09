import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PageHeader, Screen, TextField, useToast } from '../../design-system';
import { SOSButton, LocationTimeline } from '../../components/map';
import { useMapModule } from '../../contexts/MapModuleContext';
import { useAccessibilityPolicy } from '../../hooks/useAccessibilityPolicy';
import { useI18n } from '../../i18n';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

const COUNTDOWN_SEC = 5;

export default function SOSScreen() {
  const navigation = useNavigation();
  const toast = useToast();
  const { horizontalPadding } = useResponsive();
  const { colors, layout } = useTheme();
  const { sendSOS, sosHistory } = useMapModule();
  const policy = useAccessibilityPolicy();
  const { t } = useI18n();
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);

  const startSOS = useCallback(() => setCountdown(COUNTDOWN_SEC), []);

  const cancelSOS = useCallback(() => setCountdown(0), []);

  const confirmSOS = useCallback(async () => {
    setSending(true);
    try {
      await sendSOS(message.trim() || 'I need help!');
      toast.success(t('map.sosSent'));
      navigation.goBack();
    } catch (e) {
      toast.error(e.message || 'Could not send SOS');
    } finally {
      setSending(false);
      setCountdown(0);
    }
  }, [message, sendSOS, toast, navigation, t]);

  React.useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = setTimeout(() => {
      if (countdown <= 1) {
        confirmSOS();
      } else {
        setCountdown((c) => c - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, confirmSOS]);

  const timeline = (sosHistory ?? []).map((h) => ({
    id: h.id,
    title: h.userName ? `SOS from ${h.userName}` : 'SOS alert',
    subtitle: h.message,
    time: h.sentAt ? new Date(h.sentAt).toLocaleString() : '',
  }));

  if (!policy.canTriggerSOS) {
    return (
      <Screen edges={['top']}>
        <PageHeader title={t('map.sos')} onBack={() => navigation.goBack()} />
        <View style={{ padding: horizontalPadding, paddingTop: 24 }}>
          <Text accessibilityRole="alert" style={{ color: colors.textSecondary, fontSize: 16 * layout.fontScale, lineHeight: 24 }}>
            {t('map.sosRestricted')}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <PageHeader title={t('map.sos')} subtitle={t('map.emergencyContacts')} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 40, alignItems: 'center' }}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24, fontSize: 15 * layout.fontScale }}>
          Sends your live location to all family members. You have {COUNTDOWN_SEC} seconds to cancel.
        </Text>

        <SOSButton onPress={startSOS} countdown={countdown} onCancel={cancelSOS} disabled={sending} />

        <View style={{ width: '100%', marginTop: 24 }}>
          <TextField value={message} onChangeText={setMessage} placeholder="Optional message for family" multiline style={{ minHeight: 80 }} />
        </View>

        <LocationTimeline items={timeline} title="Emergency history" subtitle="Recent SOS alerts" />
      </ScrollView>
    </Screen>
  );
}
