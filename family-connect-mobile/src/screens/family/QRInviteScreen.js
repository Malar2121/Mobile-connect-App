import React from 'react';
import { ScrollView, Share, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Screen, PageHeader, Button } from '../../design-system';
import { QRInviteCard } from '../../components/family';
import { useResponsive } from '../../design-system';

export default function QRInviteScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { horizontalPadding } = useResponsive();
  const { inviteCode, inviteLink } = route.params ?? {};

  return (
    <Screen edges={['top']}>
      <PageHeader title="QR invite" subtitle="Scan to join instantly" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 32 }}>
        <QRInviteCard inviteCode={inviteCode} inviteLink={inviteLink} />
        <Button
          title="Share invite"
          onPress={() =>
            Share.share({
              message: inviteLink
                ? `Join our family! Code: ${inviteCode}\n${inviteLink}`
                : `Join our family! Code: ${inviteCode}`,
            })
          }
          style={{ marginTop: 16 }}
        />
      </ScrollView>
    </Screen>
  );
}
