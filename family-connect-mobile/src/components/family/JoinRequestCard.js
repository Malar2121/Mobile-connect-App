import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, Card } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

function JoinRequestCardComponent({ request, onApprove, onReject, onViewProfile, processing }) {
  const { colors, layout, radii } = useTheme();

  return (
    <Card style={{ marginBottom: 12 }}>
      <Pressable onPress={() => onViewProfile?.(request)} accessibilityRole="button">
        <View style={styles.row}>
          <Avatar uri={request.avatar} name={request.fullName} size={layout.avatarSize + 4} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 16 * layout.fontScale }}>
              {request.fullName}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale, marginTop: 2 }}>
              {request.email ?? 'Requested to join'}
            </Text>
            {request.requestedAt ? (
              <Text style={{ color: colors.textTertiary, fontSize: 12 * layout.fontScale, marginTop: 4 }}>
                {request.requestedAt}
              </Text>
            ) : null}
          </View>
          <View style={[styles.badge, { backgroundColor: colors.warning + '22', borderRadius: radii.full }]}>
            <Text style={{ color: colors.warning, fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>Pending</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Button
          title="Approve"
          onPress={() => onApprove?.(request)}
          loading={processing}
          style={{ flex: 1 }}
        />
        <Button title="Reject" variant="danger" onPress={() => onReject?.(request)} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}

export const JoinRequestCard = memo(JoinRequestCardComponent);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
});
