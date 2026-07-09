import React, { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

function QRInviteCardComponent({ inviteLink, inviteCode }) {
  const { colors, layout, radii } = useTheme();
  const data = inviteLink || inviteCode || '';
  const qrUri = data
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(data)}`
    : null;

  return (
    <Card>
      <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 18 * layout.fontScale }}>
        Scan to join
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale, marginTop: 4, marginBottom: 16 }}>
        Share this QR code for a quick family join experience.
      </Text>

      {qrUri ? (
        <View style={[styles.qrWrap, { backgroundColor: colors.surfaceSecondary, borderRadius: radii.xl }]}>
          <Image
            source={{ uri: qrUri }}
            style={styles.qrImage}
            accessibilityLabel="QR code for family invite"
            resizeMode="contain"
          />
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
  qrImage: { width: 220, height: 220 },
  placeholder: { alignItems: 'center', padding: 40 },
});
