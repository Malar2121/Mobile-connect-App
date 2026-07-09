import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, PageHeader, Card, Button } from '../../design-system';
import { EmptyFamilyState } from '../../components/family';
import { useFamilyModuleData } from '../../hooks/useFamilyModuleData';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function JoinRequestsScreen() {
  const navigation = useNavigation();
  const { colors, layout, radii } = useTheme();
  const { horizontalPadding } = useResponsive();
  const { canManage, noFamily, pendingJoinRequests } = useFamilyModuleData();

  if (noFamily) {
    return (
      <Screen edges={['top']}>
        <PageHeader title="Join requests" onBack={() => navigation.goBack()} />
        <EmptyFamilyState
          onCreate={() => navigation.navigate('CreateFamily')}
          onJoin={() => navigation.navigate('JoinFamily')}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <PageHeader
        title="Join requests"
        subtitle="Review pending family joins"
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 32 }}>
        <Card>
          <View style={[styles.infoIcon, { backgroundColor: colors.primarySubtle, borderRadius: radii.lg }]}>
            <Ionicons name="information-circle-outline" size={28} color={colors.primary} />
          </View>
          <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 17 * layout.fontScale, marginTop: 14 }}>
            Instant join is enabled
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginTop: 8, lineHeight: 22 }}>
            Your family uses invite codes for instant joining. There is no approval queue on the backend yet — members
            join immediately when they enter a valid code.
          </Text>
          <Text style={{ color: colors.textTertiary, fontSize: 12 * layout.fontScale, marginTop: 12 }}>
            TODO: Implement POST /api/family/join-requests with approve/reject when backend supports moderated joins.
          </Text>
        </Card>

        {canManage && pendingJoinRequests === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.surfaceSecondary, borderRadius: radii.xl, borderColor: colors.border }]}>
            <Ionicons name="checkmark-circle-outline" size={40} color={colors.success} />
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 16 * layout.fontScale, marginTop: 12 }}>
              No pending requests
            </Text>
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 6, fontSize: 14 * layout.fontScale }}>
              When join-request approval is added, pending requests will appear here.
            </Text>
            <Button
              title="Manage invites"
              variant="secondary"
              onPress={() => navigation.navigate('InviteMembers')}
              style={{ marginTop: 16 }}
            />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  infoIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 28, marginTop: 16, borderWidth: StyleSheet.hairlineWidth },
});
