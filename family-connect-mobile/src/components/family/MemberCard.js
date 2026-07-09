import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Card } from '../../design-system';
import { RelationshipBadge } from './RelationshipBadge';
import { RoleBadge } from './RoleBadge';
import { useTheme } from '../../hooks/useTheme';
import { formatLastActive, isMemberOnline } from '../../utils/familyModuleHelpers';

function computeAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function MemberCardComponent({ member, onPress, onCall, onMessage, onViewProfile }) {
  const { colors, layout, radii } = useTheme();
  const online = isMemberOnline(member.lastSeen, member.location?.updatedAt);
  const lastActive = formatLastActive(member.lastSeen);
  const age = computeAge(member.dateOfBirth);

  return (
    <Pressable
      onPress={() => onPress?.(member)}
      accessibilityRole="button"
      accessibilityLabel={`${member.fullName}, ${member.relationshipLabel}, ${member.displayRole}`}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1, marginBottom: 12 }]}
    >
      <Card>
        <View style={styles.row}>
          <View>
            <Avatar uri={member.avatar} name={member.fullName} size={layout.avatarSize + 8} />
            {online ? (
              <View style={[styles.onlineDot, { backgroundColor: colors.success, borderColor: colors.surface }]} />
            ) : null}
          </View>

          <View style={styles.body}>
            <Text
              style={{
                color: colors.text,
                fontFamily: 'Inter_700Bold',
                fontSize: 17 * layout.fontScale,
              }}
              numberOfLines={1}
            >
              {member.fullName}
            </Text>
            <View style={styles.badges}>
              <RelationshipBadge label={member.relationshipLabel} compact />
              <RoleBadge role={member.displayRole} compact />
            </View>
            <View style={styles.meta}>
              {age != null ? (
                <Text style={[styles.metaText, { color: colors.textSecondary, fontSize: 12 * layout.fontScale }]}>
                  Age {age}
                </Text>
              ) : null}
              <Text style={[styles.metaText, { color: colors.textSecondary, fontSize: 12 * layout.fontScale }]}>
                {online ? 'Online now' : `Active ${lastActive}`}
              </Text>
              {member.hasLocation ? (
                <View style={styles.locRow}>
                  <Ionicons name="location-outline" size={12} color={colors.success} />
                  <Text style={{ color: colors.success, fontSize: 11 * layout.fontScale, marginLeft: 2 }}>
                    Location shared
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          <ActionChip icon="call-outline" label="Call" onPress={() => onCall?.(member)} colors={colors} layout={layout} />
          <ActionChip icon="chatbubble-outline" label="Message" onPress={() => onMessage?.(member)} colors={colors} layout={layout} />
          <ActionChip icon="person-outline" label="Profile" onPress={() => onViewProfile?.(member)} colors={colors} layout={layout} />
        </View>
      </Card>
    </Pressable>
  );
}

function ActionChip({ icon, label, onPress, colors, layout }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionChip, { opacity: pressed ? 0.8 : 1, minHeight: layout.minTouch }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={{ color: colors.primary, fontSize: 12 * layout.fontScale, marginTop: 4, fontFamily: 'Inter_600SemiBold' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export const MemberCard = memo(MemberCardComponent);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  body: { flex: 1, marginLeft: 14 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  meta: { marginTop: 8, gap: 2 },
  metaText: { fontFamily: 'Inter_400Regular' },
  locRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionChip: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
});
