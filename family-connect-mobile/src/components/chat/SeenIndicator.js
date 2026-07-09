import React, { memo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getOutgoingStatus, getSeenByLabel } from '../../utils/chatHelpers';

function SeenIndicatorComponent({ message, userId, familyMemberCount, isMine }) {
  if (!isMine) return null;
  const status = getOutgoingStatus(message, userId, familyMemberCount);
  const label = getSeenByLabel(message, userId, familyMemberCount);

  return (
    <View style={styles.row}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {status === 'sending' ? (
        <ActivityIndicator size="small" color="rgba(255,255,255,0.85)" />
      ) : status === 'seen' ? (
        <Ionicons name="checkmark-done" size={14} color="#BFDBFE" />
      ) : status === 'delivered' ? (
        <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.75)" />
      ) : (
        <Ionicons name="checkmark" size={14} color="rgba(255,255,255,0.75)" />
      )}
    </View>
  );
}

export const SeenIndicator = memo(SeenIndicatorComponent);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { color: 'rgba(255,255,255,0.72)', fontSize: 11 },
});
