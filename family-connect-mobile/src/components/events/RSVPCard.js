import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../design-system';
import { MemberAvatarStack } from '../family/MemberAvatarStack';
import { useTheme } from '../../hooks/useTheme';
import { buildRsvpSummary, getGuestAvatar, getGuestDisplayName } from '../../utils/eventModuleHelpers';

const STATUS_COLORS = {
  accepted: '#10B981',
  maybe: '#F59E0B',
  declined: '#EF4444',
  pending: '#94A3B8',
};

function RSVPCardComponent({ event, showGuests }) {
  const { colors, layout, radii } = useTheme();
  const summary = buildRsvpSummary(event);
  const { progress } = summary;

  const guestMembers = (event?.guests ?? []).map((g) => ({
    _id: g.userId?._id ?? g.userId,
    fullName: getGuestDisplayName(g),
    avatar: getGuestAvatar(g),
  }));

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl }]}>
      <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 16 * layout.fontScale }}>RSVP</Text>
      <View style={[styles.bar, { backgroundColor: colors.border, borderRadius: radii.full, marginTop: 12 }]}>
        <View
          style={[
            styles.fill,
            { width: `${progress.pct}%`, backgroundColor: colors.primary, borderRadius: radii.full },
          ]}
        />
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>
        {progress.responded} of {progress.total} responded ({progress.pct}%)
      </Text>

      <View style={styles.stats}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <View key={status} style={styles.stat}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={{ color: colors.text, fontSize: 13 * layout.fontScale, marginLeft: 6, textTransform: 'capitalize' }}>
              {summary[status]} {status}
            </Text>
          </View>
        ))}
      </View>

      {guestMembers.length > 0 ? (
        <View style={{ marginTop: 14 }}>
          <MemberAvatarStack members={guestMembers} max={8} />
        </View>
      ) : null}

      {showGuests ? (
        <View style={{ marginTop: 14 }}>
          {(event?.guests ?? []).map((g) => (
            <View key={String(g.userId?._id ?? g.userId)} style={styles.guestRow}>
              <Avatar uri={getGuestAvatar(g)} name={getGuestDisplayName(g)} size={32} />
              <Text style={{ color: colors.text, flex: 1, marginLeft: 10, fontSize: 14 * layout.fontScale }}>
                {getGuestDisplayName(g)}
              </Text>
              <Text style={{ color: STATUS_COLORS[g.status] ?? colors.textTertiary, fontSize: 12, textTransform: 'capitalize' }}>
                {g.status}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export const RSVPCard = memo(RSVPCardComponent);

const styles = StyleSheet.create({
  wrap: { padding: 16, borderWidth: StyleSheet.hairlineWidth },
  bar: { height: 8, overflow: 'hidden' },
  fill: { height: 8 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  stat: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  guestRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
});
