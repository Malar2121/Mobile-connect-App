import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Card } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

/**
 * Renders the family invite QR entirely on-device.
 *
 * This used to build an <Image> URL against api.qrserver.com, which meant a
 * live join credential for a private family was sent to a third party and
 * written into its access logs every time an admin opened the invite screen.
 * The proposal's own constraint is that family data stays private, so the
 * code is now encoded locally and never leaves the phone.
 */
function QRInviteCardComponent({ inviteLink, inviteCode }) {
  const { colors, layout, radii } = useTheme();
  const data = inviteLink || inviteCode || '';

  return (
    <Card>
      <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 18 * layout.fontScale }}>
        Scan to join
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale, marginTop: 4, marginBottom: 16 }}>
        Share this QR code for a quick family join experience.
      </Text>

      {data ? (
        <View
          style={[styles.qrWrap, { backgroundColor: colors.surfaceSecondary, borderRadius: radii.xl }]}
          accessible
          accessibilityRole="image"
          accessibilityLabel="QR code for the family invite"
        >
          {/* Fixed light-on-dark values: a QR must stay high-contrast and
              light-grounded in both themes or scanners fail on it. */}
          <QRCode value={data} size={220} color="#000000" backgroundColor="#FFFFFF" ecl="M" />
        </View>
      ) : (
        <View style={[styles.placeholder, { backgroundColor: colors.surfaceSecondary, borderRadius: radii.xl }]}>
          <Ionicons name="qr-code-outline" size={64} color={colors.textTertiary} />
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Generate an invite to show QR</Text>
        </View>
      )}

      {inviteCode ? (
        <Text
          style={{
            color: colors.primary,
            fontFamily: 'Inter_700Bold',
            fontSize: 18 * layout.fontScale,
            letterSpacing: 2,
            textAlign: 'center',
            marginTop: 16,
          }}
        >
          {inviteCode}
        </Text>
      ) : null}
    </Card>
  );
}

export const QRInviteCard = memo(QRInviteCardComponent);

const styles = StyleSheet.create({
  qrWrap: { alignItems: 'center', padding: 20 },
  placeholder: { alignItems: 'center', padding: 40 },
});
