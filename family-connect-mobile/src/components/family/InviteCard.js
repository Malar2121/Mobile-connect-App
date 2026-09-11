import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Card, Button } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../design-system';
import { useI18n } from '../../i18n';

function InviteCardComponent({
  inviteCode,
  inviteLink,
  expiresAt,
  status = 'active',
  onRegenerate,
  onShare,
  regenerating,
  readOnly,
}) {
  const { colors, layout, radii } = useTheme();

  const { t } = useI18n();
  const toast = useToast();

  async function copyCode() {
    if (!inviteCode) return;
    await Clipboard.setStringAsync(inviteCode);
    toast.success(t('family.codeCopied'));
  }

  async function copyLink() {
    if (!inviteLink) return;
    await Clipboard.setStringAsync(inviteLink);
    toast.success(t('family.linkCopied'));
  }

  return (
    <Card>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.primarySubtle, borderRadius: radii.lg }]}>
          <Ionicons name="ticket-outline" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 18 * layout.fontScale }}>
            {t('family.familyInvite')}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale, marginTop: 2 }}>
            {t('family.inviteStatus', { status: status === 'active' ? t('family.statusActive') : status })}
            {expiresAt ? t('family.expiresValue', { value: new Date(expiresAt).toLocaleDateString() }) : t('family.noExpirySet')}
          </Text>
        </View>
      </View>

      {inviteCode ? (
        <Pressable
          onPress={copyCode}
          style={[styles.codeBox, { backgroundColor: colors.surfaceSecondary, borderRadius: radii.lg }]}
          accessibilityRole="button"
          accessibilityLabel={t('family.inviteCodeInvitecodeDoubleTapTo', { inviteCode })}
        >
          <Text
            style={{
              color: colors.primary,
              fontFamily: 'Inter_700Bold',
              fontSize: 24 * layout.fontScale,
              letterSpacing: 3,
              textAlign: 'center',
            }}
          >
            {inviteCode}
          </Text>
          <Text style={{ color: colors.textTertiary, fontSize: 12, textAlign: 'center', marginTop: 6 }}>
            {t('family.tapToCopyCode')}
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.actions}>
        <Button title={t('family.copyCode')} variant="secondary" onPress={copyCode} style={{ flex: 1 }} />
        {inviteLink ? (
          <Button title={t('family.copyLink')} variant="secondary" onPress={copyLink} style={{ flex: 1 }} />
        ) : null}
      </View>

      {!readOnly ? (
        <View style={{ marginTop: 10, gap: 8 }}>
          {onShare ? <Button title={t('family.shareInvite')} onPress={onShare} icon={<Ionicons name="share-outline" size={18} color="#fff" />} /> : null}
          {onRegenerate ? (
            <Button
              title={t('family.regenerateCode')}
              variant="ghost"
              onPress={onRegenerate}
              loading={regenerating}
            />
          ) : null}
        </View>
      ) : null}

      {/* A shared family code deliberately has no expiry — it stays valid until
          an admin regenerates it. Email invitations are the expiring, one-time
          option. Say that plainly rather than leaving it unexplained. */}
      {!expiresAt ? (
        <Text style={{ color: colors.textTertiary, fontSize: 12 * layout.fontScale, marginTop: 12 }}>
          {t('family.thisCodeStaysValidUntilYou')}
        </Text>
      ) : null}
    </Card>
  );
}

export const InviteCard = memo(InviteCardComponent);

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  icon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  codeBox: { padding: 20, marginBottom: 14 },
  actions: { flexDirection: 'row', gap: 10 },
});
