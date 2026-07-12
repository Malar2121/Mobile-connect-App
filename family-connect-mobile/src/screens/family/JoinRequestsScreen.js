import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, PageHeader, Card, Button } from '../../design-system';
import { EmptyFamilyState } from '../../components/family';
import { useFamilyModuleData } from '../../hooks/useFamilyModuleData';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive, useToast } from '../../design-system';
import { approveJoinRequest, rejectJoinRequest } from '../../services/familyService';

export default function JoinRequestsScreen() {
  const navigation = useNavigation();
  const toast = useToast();
  const { colors, layout, radii } = useTheme();
  const { horizontalPadding } = useResponsive();
  const { canManage, noFamily, pendingJoinRequests, joinRequests, refresh } = useFamilyModuleData();
  const [processing, setProcessing] = useState(null);

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

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await approveJoinRequest(id);
      toast.success('Request approved');
      refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id) => {
    setProcessing(id);
    try {
      await rejectJoinRequest(id);
      toast.success('Request rejected');
      refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setProcessing(null);
    }
  };

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
            Moderated joins enabled
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginTop: 8, lineHeight: 22 }}>
            Your family uses invite codes. Members request to join and an admin must approve them.
          </Text>
        </Card>

        {canManage && pendingJoinRequests === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.surfaceSecondary, borderRadius: radii.xl, borderColor: colors.border }]}>
            <Ionicons name="checkmark-circle-outline" size={40} color={colors.success} />
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 16 * layout.fontScale, marginTop: 12 }}>
              No pending requests
            </Text>
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 6, fontSize: 14 * layout.fontScale }}>
              When someone uses your invite code, their request will appear here.
            </Text>
            <Button
              title="Manage invites"
              variant="secondary"
              onPress={() => navigation.navigate('InviteMembers')}
              style={{ marginTop: 16 }}
            />
          </View>
        ) : (
          canManage && joinRequests?.map(req => (
            <Card key={req._id} style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 16 * layout.fontScale }}>
                  {req.user?.fullName || req.user?.email || 'Unknown User'}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginTop: 2 }}>
                  Requested to join
                </Text>
              </View>
              {processing === req._id ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button variant="secondary" title="Reject" onPress={() => handleReject(req._id)} />
                  <Button variant="primary" title="Approve" onPress={() => handleApprove(req._id)} />
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  infoIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 28, marginTop: 16, borderWidth: StyleSheet.hairlineWidth },
});
