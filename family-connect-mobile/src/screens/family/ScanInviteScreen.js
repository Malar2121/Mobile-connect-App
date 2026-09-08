import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, PageHeader, Screen, useToast } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';
import { useFamily } from '../../contexts/FamilyContext';
import { parseInviteScan } from '../../utils/inviteLink';
import { acceptInvitation, verifyInvitation } from '../../services/invitationService';

/**
 * Scan a family invite QR to join (proposal §5.2 — "easy onboarding using QR
 * code invitations").
 *
 * Handles both things a Family Connect QR can carry: a shareable invite code,
 * and a one-time emailed invitation token. Anything else is rejected with a
 * plain message rather than being sent to the server to fail there.
 */
export default function ScanInviteScreen() {
  const navigation = useNavigation();
  const { colors, layout, radii } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const { joinFamily, refreshFamily } = useFamily();

  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Barcode callbacks fire continuously while a code is in frame; without this
  // one scan would launch many join requests.
  const handled = useRef(false);

  const resetScanner = useCallback(() => {
    handled.current = false;
    setError('');
  }, []);

  const handleScanned = useCallback(
    async ({ data }) => {
      if (handled.current || busy) return;
      handled.current = true;

      const parsed = parseInviteScan(data);
      if (parsed.kind === 'invalid') {
        setError(
          parsed.reason === 'link_missing_code'
            ? t('scan.linkMissingCode')
            : t('scan.notAnInvite'),
        );
        return;
      }

      setBusy(true);
      setError('');
      try {
        if (parsed.kind === 'token') {
          // Name the family before joining, so the user knows what they are
          // accepting rather than being dropped into an unknown group.
          const info = await verifyInvitation(parsed.value);
          await acceptInvitation(parsed.value);
          await refreshFamily();
          toast.success(t('scan.joined', { family: info?.familyName ?? '' }));
        } else {
          const result = await joinFamily(parsed.value);
          if (result?.pending) {
            toast.success(result.message || t('scan.requestSent'));
            navigation.goBack();
            return;
          }
          await refreshFamily();
          toast.success(t('scan.joinedGeneric'));
        }
        navigation.goBack();
      } catch (e) {
        setError(e.message || t('scan.failed'));
      } finally {
        setBusy(false);
      }
    },
    [busy, t, toast, joinFamily, refreshFamily, navigation],
  );

  // ── Permission states ───────────────────────────────────
  if (!permission) {
    return (
      <Screen edges={['top']}>
        <PageHeader title={t('scan.title')} onBack={() => navigation.goBack()} />
        <Text style={{ color: colors.textSecondary, fontSize: 15 * layout.fontScale }}>
          {t('common.loading')}
        </Text>
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen edges={['top']}>
        <PageHeader title={t('scan.title')} onBack={() => navigation.goBack()} />
        <Card>
          <View style={styles.center}>
            <Ionicons name="camera-outline" size={48} color={colors.textTertiary} />
            <Text
              style={{
                color: colors.text,
                fontFamily: 'Inter_600SemiBold',
                fontSize: 16 * layout.fontScale,
                marginTop: 12,
                textAlign: 'center',
              }}
            >
              {t('scan.permissionTitle')}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14 * layout.fontScale,
                marginTop: 6,
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              {permission.canAskAgain ? t('scan.permissionBody') : t('scan.permissionDenied')}
            </Text>
          </View>

          {permission.canAskAgain ? (
            <Button title={t('scan.allowCamera')} onPress={requestPermission} style={{ marginTop: 16 }} />
          ) : null}

          <Button
            title={t('scan.enterCodeInstead')}
            variant="secondary"
            onPress={() => navigation.navigate('JoinFamily')}
            style={{ marginTop: 10 }}
          />
        </Card>
      </Screen>
    );
  }

  // ── Scanner ─────────────────────────────────────────────
  return (
    <Screen edges={['top']}>
      <PageHeader title={t('scan.title')} subtitle={t('scan.subtitle')} onBack={() => navigation.goBack()} />

      <View style={[styles.viewport, { borderRadius: radii.xl, borderColor: colors.border }]}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handled.current || busy ? undefined : handleScanned}
        />
        {/* Aiming frame — purely visual, so it must not swallow taps. */}
        <View pointerEvents="none" style={styles.overlay}>
          <View style={[styles.reticle, { borderColor: colors.primary }]} />
        </View>
      </View>

      {busy ? (
        <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginTop: 14, textAlign: 'center' }}>
          {t('scan.joining')}
        </Text>
      ) : null}

      {error ? (
        <Card style={{ marginTop: 14 }}>
          <Text style={{ color: colors.error, fontSize: 14 * layout.fontScale }}>{error}</Text>
          <Button title={t('scan.scanAgain')} variant="secondary" onPress={resetScanner} style={{ marginTop: 12 }} />
        </Card>
      ) : null}

      <Button
        title={t('scan.enterCodeInstead')}
        variant="ghost"
        onPress={() => navigation.navigate('JoinFamily')}
        style={{ marginTop: 16 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', paddingVertical: 12 },
  viewport: {
    height: 340,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: '#000',
  },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  reticle: {
    width: 210,
    height: 210,
    borderWidth: 3,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
});
