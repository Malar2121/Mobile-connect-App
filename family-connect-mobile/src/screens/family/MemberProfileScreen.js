import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  PageHeader,
  Avatar,
  Card,
  SectionTitle,
  StatCard,
  Loader,
} from '../../design-system';
import { RelationshipBadge, RoleBadge, TimelineItem } from '../../components/family';
import { useFamilyModuleData } from '../../hooks/useFamilyModuleData';
import { buildMemberStats, formatLastActive, isMemberOnline } from '../../utils/familyModuleHelpers';
import { getUploaderId } from '../../utils/memoryHelpers';
import { formatNotificationTime, getNotificationIcon } from '../../utils/notificationHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive, Button, useToast } from '../../design-system';
import { updateMemberRole, updateMemberType } from '../../services/familyService';

const MEMBER_TYPE_LABEL = { adult: 'Adult', child: 'Child', elder: 'Elder' };

export default function MemberProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const toast = useToast();
  const { colors, layout, radii } = useTheme();
  const { horizontalPadding } = useResponsive();
  const memberId = route.params?.memberId;
  const { members, memories, events, messages, notifications, loading, family, canManage, refresh } = useFamilyModuleData();

  const member = useMemo(
    () => members.find((m) => String(m._id) === String(memberId)),
    [members, memberId],
  );

  const stats = useMemo(
    () => (member ? buildMemberStats(member._id, { memories, events, messages }) : null),
    [member, memories, events, messages],
  );

  const memberMemories = useMemo(
    () => (memories ?? []).filter((m) => getUploaderId(m) === String(memberId)).slice(0, 5),
    [memories, memberId],
  );

  const recentActivity = useMemo(() => {
    if (!member) return [];
    return (notifications ?? [])
      .filter((n) => n.actor?._id === memberId || n.body?.includes(member.fullName))
      .slice(0, 4)
      .map((n) => ({
        id: n._id,
        title: n.title,
        body: n.body,
        time: formatNotificationTime(n.createdAt),
        icon: getNotificationIcon(n.type),
      }));
  }, [notifications, member, memberId]);

  if (loading && !member) {
    return (
      <Screen edges={['top']}>
        <PageHeader title="Member" onBack={() => navigation.goBack()} />
        <Loader />
      </Screen>
    );
  }

  if (!member) {
    return (
      <Screen edges={['top']}>
        <PageHeader title="Member" onBack={() => navigation.goBack()} />
        <Text style={{ color: colors.textSecondary, padding: horizontalPadding }}>Member not found.</Text>
      </Screen>
    );
  }

  const online = isMemberOnline(member.lastSeen, member.location?.updatedAt);
  const joinedDate = member.joinedAt
    ? new Date(member.joinedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Unknown';

  return (
    <Screen edges={['top']}>
      <PageHeader title={member.fullName} subtitle="Member profile" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Avatar uri={member.avatar} name={member.fullName} size={layout.avatarSize + 36} />
          <View style={styles.badges}>
            <RelationshipBadge label={member.relationshipLabel} />
            <RoleBadge role={member.displayRole} />
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginTop: 10 }}>
            {online ? 'Online now' : `Last active ${formatLastActive(member.lastSeen)}`}
          </Text>
          <Text style={{ color: colors.textTertiary, fontSize: 13 * layout.fontScale, marginTop: 4 }}>
            Joined {joinedDate}
          </Text>
        </View>

        <View style={styles.stats}>
          <StatCard label="Participation" value={stats?.participation ?? 0} gradientKey="primary" />
          <StatCard label="Memories" value={stats?.memoriesShared ?? 0} gradientKey="warm" />
          <StatCard label="Events" value={stats?.eventsAttended ?? 0} gradientKey="cool" />
        </View>

        <View >
          <SectionTitle title="Shared memories" subtitle={`${memberMemories.length} recent uploads`} />
          {memberMemories.length === 0 ? (
            <Card>
              <Text style={{ color: colors.textSecondary }}>No shared memories yet.</Text>
            </Card>
          ) : (
            memberMemories.map((m) => (
              <Card key={m._id} style={{ marginBottom: 8 }}>
                <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }} numberOfLines={2}>
                  {m.caption || 'Memory upload'}
                </Text>
                <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 4 }}>
                  {new Date(m.createdAt).toLocaleDateString()}
                </Text>
              </Card>
            ))
          )}

          <SectionTitle title="Recent activity" style={{ marginTop: 20 }} />
          {recentActivity.length === 0 ? (
            <Card>
              <Text style={{ color: colors.textSecondary }}>No recent activity recorded.</Text>
            </Card>
          ) : (
            recentActivity.map((item, i) => (
              <TimelineItem key={item.id} item={item} isLast={i === recentActivity.length - 1} />
            ))
          )}

          <SectionTitle title="Privacy" subtitle="Member visibility settings" style={{ marginTop: 20 }} />
          <Card>
            <PrivacyRow icon="location-outline" label="Location sharing" value={member.hasLocation ? 'Enabled' : 'Not shared'} colors={colors} layout={layout} />
            <PrivacyRow icon="images-outline" label="Album contributions" value={`${stats?.memoriesShared ?? 0} albums`} colors={colors} layout={layout} />
            <PrivacyRow icon="chatbubble-outline" label="Chat" value="Family chat enabled" colors={colors} layout={layout} />
          </Card>

          {canManage && (
            <>
              <SectionTitle title="Administration" subtitle="Manage member role" style={{ marginTop: 20 }} />
              <Card>
                <Text style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale, marginBottom: 8 }}>
                  Current Role: {member.displayRole}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {['admin', 'parent', 'member', 'child'].map(r => (
                    <Button 
                      key={r}
                      title={r.charAt(0).toUpperCase() + r.slice(1)} 
                      variant={member.displayRole === r ? 'primary' : 'secondary'} 
                      onPress={async () => {
                        try {
                          await updateMemberRole(memberId, r);
                          toast.success(`Role updated to ${r}`);
                          refresh();
                        } catch(e) {
                          toast.error(e.message);
                        }
                      }}
                    />
                  ))}
                </View>
              </Card>

              <SectionTitle
                title="Member type"
                subtitle="Child accounts get the kids UI and tracking; elders get the simplified UI"
                style={{ marginTop: 20 }}
              />
              <Card>
                <Text style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale, marginBottom: 8 }}>
                  Current type: {MEMBER_TYPE_LABEL[member.memberType] ?? 'Adult'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {['adult', 'child', 'elder'].map((type) => (
                    <Button
                      key={type}
                      title={MEMBER_TYPE_LABEL[type]}
                      variant={(member.memberType ?? 'adult') === type ? 'primary' : 'secondary'}
                      onPress={async () => {
                        try {
                          await updateMemberType(memberId, type);
                          toast.success(`Member type updated to ${MEMBER_TYPE_LABEL[type]}`);
                          refresh();
                        } catch (e) {
                          toast.error(e.message);
                        }
                      }}
                    />
                  ))}
                </View>
              </Card>
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function PrivacyRow({ icon, label, value, colors, layout }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={{ flex: 1, marginLeft: 12, color: colors.text, fontSize: 14 * layout.fontScale }}>{label}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: 8, paddingBottom: 16 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: 10, marginBottom: 8 },
});
