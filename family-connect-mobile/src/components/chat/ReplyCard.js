import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getSender } from '../../utils/chatHelpers';
import { useTheme } from '../../hooks/useTheme';

function ReplyCardComponent({ reply, isMine }) {
  const { colors, isDark } = useTheme();
  if (!reply) return null;
  const sender = typeof reply === 'object' ? getSender(reply) : { fullName: 'Family' };

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: isMine ? 'rgba(255,255,255,0.15)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
      ]}
    >
      <Text style={{ color: isMine ? '#E0E7FF' : colors.primary, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
        {sender.fullName}
      </Text>
      <Text style={{ color: isMine ? 'rgba(255,255,255,0.8)' : colors.textSecondary, fontSize: 12 }} numberOfLines={2}>
        {reply.text || (reply.mediaType ? `${reply.mediaType} message` : 'Message')}
      </Text>
    </View>
  );
}

export const ReplyCard = memo(ReplyCardComponent);

const styles = StyleSheet.create({
  wrap: { borderRadius: 12, padding: 8, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: 'rgba(99,102,241,0.6)' },
});
