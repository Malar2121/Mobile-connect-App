import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatNotificationTime, getNotificationIcon } from './notificationHelpers';
import { getUploaderId, getLikeCount } from './memoryHelpers';
import { guestEntryUserId } from './eventFormat';
import { getSenderId } from './chatHelpers';
import { translate } from '../i18n';

/** UI relationship labels mapped to backend family-tree enums */
export const RELATIONSHIP_OPTIONS = [
  { id: 'father', get label() { return translate('family.father'); }, backendType: 'parent', get nickname() { return translate('family.father'); } },
  { id: 'mother', get label() { return translate('family.mother'); }, backendType: 'parent', get nickname() { return translate('family.mother'); } },
  { id: 'brother', get label() { return translate('family.brother'); }, backendType: 'sibling', get nickname() { return translate('family.brother'); } },
  { id: 'sister', get label() { return translate('family.sister'); }, backendType: 'sibling', get nickname() { return translate('family.sister'); } },
  { id: 'grandparent', get label() { return translate('family.grandparent'); }, backendType: 'grandparent' },
  { id: 'child', get label() { return translate('auth.memberChild'); }, backendType: 'child' },
  { id: 'guardian', get label() { return translate('family.guardian'); }, backendType: 'other', get nickname() { return translate('family.guardian'); } },
  { id: 'relative', get label() { return translate('family.relative'); }, backendType: 'other', get nickname() { return translate('family.relative'); } },
  { id: 'friend', get label() { return translate('family.friendOfFamily'); }, backendType: 'other', nickname: 'Friend' },
];

export const ROLE_DEFINITIONS = [
  {
    id: 'guest',
    get label() { return translate('family.guest'); },
    mapsFrom: 'guest',
    get description() { return translate('family.extendedRelativeWithReadOnlyAccess'); },
    permissionKeys: ['family.permViewEvents', 'family.permViewSharedMemories', 'family.permReadChat'],
    readOnly: true,
  },
  {
    id: 'owner',
    get label() { return translate('family.owner'); },
    mapsFrom: 'admin',
    get description() { return translate('family.familyCreatorWithFullControlCannot'); },
    permissionKeys: ['family.permAll', 'family.permRegenerateInvite', 'family.permManageRelationships', 'family.permFamilySettings'],
    readOnly: true,
  },
  {
    id: 'admin',
    get label() { return translate('family.admin'); },
    mapsFrom: 'admin',
    get description() { return translate('family.fullFamilyAdministrationExceptOwnershipTransfer'); },
    permissionKeys: ['family.permInviteMembers', 'family.permRegenerateInviteCode', 'family.permManageRelationships'],
    readOnly: true,
  },
  {
    id: 'parent',
    get label() { return translate('family.parent'); },
    mapsFrom: 'parent',
    get description() { return translate('family.canCreateEventsUploadMemoriesAnd'); },
    permissionKeys: ['family.permCreateEvents', 'family.permUploadMemories', 'family.permViewLocations'],
    readOnly: true,
  },
  {
    id: 'member',
    get label() { return translate('common.member'); },
    mapsFrom: 'member',
    get description() { return translate('family.standardFamilyParticipant'); },
    permissionKeys: ['family.permChat', 'family.permRsvpEvents', 'family.permViewSharedMemories'],
    readOnly: true,
  },
  {
    id: 'child',
    get label() { return translate('auth.memberChild'); },
    mapsFrom: 'child',
    get description() { return translate('family.restrictedExperienceWithMinorModeProtections'); },
    permissionKeys: ['family.permLimitedChat', 'family.permViewFamilyContent'],
    readOnly: true,
  },
];

const PERMISSIONS_STORAGE_KEY = (familyId) => `fc_family_permissions_${familyId}`;
const MOTTO_STORAGE_KEY = (familyId) => `fc_family_motto_${familyId}`;
const INVITE_HISTORY_KEY = (familyId) => `fc_invite_history_${familyId}`;

export async function loadFamilyMotto(familyId) {
  if (!familyId) return '';
  return (await AsyncStorage.getItem(MOTTO_STORAGE_KEY(familyId))) ?? '';
}

export async function saveFamilyMotto(familyId, motto) {
  if (!familyId) return;
  await AsyncStorage.setItem(MOTTO_STORAGE_KEY(familyId), motto.trim());
}

export async function loadFamilyPermissions(familyId) {
  if (!familyId) return getDefaultPermissions();
  try {
    const raw = await AsyncStorage.getItem(PERMISSIONS_STORAGE_KEY(familyId));
    return raw ? { ...getDefaultPermissions(), ...JSON.parse(raw) } : getDefaultPermissions();
  } catch {
    return getDefaultPermissions();
  }
}

export async function saveFamilyPermissions(familyId, permissions) {
  if (!familyId) return;
  await AsyncStorage.setItem(PERMISSIONS_STORAGE_KEY(familyId), JSON.stringify(permissions));
}

export function getDefaultPermissions() {
  return {
    familyPrivacy: 'members_only',
    locationSharing: true,
    albumSharing: true,
    memoryVisibility: 'family',
    chatPermissions: 'all_members',
    notificationPreferences: true,
    invitationPermissions: 'admin_only',
  };
}

export async function appendInviteHistory(familyId, entry) {
  if (!familyId) return;
  try {
    const raw = await AsyncStorage.getItem(INVITE_HISTORY_KEY(familyId));
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({ ...entry, id: Date.now().toString(), at: new Date().toISOString() });
    await AsyncStorage.setItem(INVITE_HISTORY_KEY(familyId), JSON.stringify(list.slice(0, 20)));
  } catch {
    /* best effort */
  }
}

export async function loadInviteHistory(familyId) {
  if (!familyId) return [];
  try {
    const raw = await AsyncStorage.getItem(INVITE_HISTORY_KEY(familyId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function resolveDisplayRole(user, family) {
  const role = user?.role ?? 'member';
  const isOwner =
    family?.createdBy &&
    String(family.createdBy._id ?? family.createdBy) === String(user._id);
  if (isOwner && role === 'admin') return 'owner';
  return role;
}

export function getRoleDefinition(roleId) {
  return ROLE_DEFINITIONS.find((r) => r.id === roleId || r.mapsFrom === roleId) ?? ROLE_DEFINITIONS[3];
}

export function mapTreeNodeToMember(nodes, userId) {
  const node = (nodes ?? []).find((n) => String(n.id) === String(userId));
  if (!node) return null;
  const rel = RELATIONSHIP_OPTIONS.find(
    (r) => r.backendType === node.relationshipType && (!r.nickname || r.nickname === node.nickname),
  );
  return {
    relationshipType: node.relationshipType,
    relationshipLabel: rel?.label ?? node.nickname ?? formatRelationshipType(node.relationshipType),
    nickname: node.nickname,
    relatedTo: node.relatedTo,
    relatedToName: node.relatedToName,
    joinedAt: node.joinedAt,
  };
}

export function formatRelationshipType(type) {
  if (!type || type === 'other') return translate('family.familyMember');
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function isMemberOnline(lastSeen, locationUpdatedAt) {
  const ts = locationUpdatedAt || lastSeen;
  if (!ts) return false;
  return Date.now() - new Date(ts).getTime() < 15 * 60 * 1000;
}

export function formatLastActive(lastSeen) {
  if (!lastSeen) return translate('family.unknown');
  return formatNotificationTime(lastSeen);
}

export function buildMemberStats(memberId, { memories, events, messages }) {
  const id = String(memberId);
  const memoriesShared = (memories ?? []).filter((m) => getUploaderId(m) === id).length;
  const eventsAttended = (events ?? []).filter((e) =>
    (e.guests ?? []).some(
      (g) => guestEntryUserId(g) === id && g.status === 'accepted',
    ),
  ).length;
  const messagesSent = (messages ?? []).filter((m) => getSenderId(m) === id).length;
  const participation = memoriesShared * 3 + eventsAttended * 2 + messagesSent;
  return { memoriesShared, eventsAttended, messagesSent, participation };
}

export function buildFamilyTimeline({ family, members, notifications, memories, uiMode }) {
  const items = [];
  const creatorId = String(family?.createdBy?._id ?? family?.createdBy ?? '');

  if (family?.createdAt) {
    items.push({
      id: 'family-created',
      title: translate('family.nameWasCreated', { name: family.name }),
      body: translate('family.yourFamilyHomeWasEstablished'),
      time: formatNotificationTime(family.createdAt),
      timestamp: new Date(family.createdAt).getTime(),
      icon: 'home-outline',
    });
  }

  (members ?? []).forEach((m) => {
    if (String(m._id) === creatorId) return;
    items.push({
      id: `join-${m._id}`,
      title: translate('family.fullnameJoinedTheFamily', { fullName: m.fullName }),
      body: translate('family.inviteAccepted'),
      time: formatNotificationTime(m.createdAt),
      timestamp: new Date(m.createdAt).getTime(),
      icon: 'person-add-outline',
      avatar: m.avatar,
      actorName: m.fullName,
    });
  });

  (notifications ?? [])
    .filter((n) => uiMode !== 'minor' || n.type !== 'chat_message')
    .slice(0, 8)
    .forEach((n) => {
      items.push({
        id: `n-${n._id}`,
        title: n.title,
        body: n.body,
        time: formatNotificationTime(n.createdAt),
        timestamp: new Date(n.createdAt).getTime(),
        icon: getNotificationIcon(n.type),
      });
    });

  (memories ?? []).slice(0, 5).forEach((m) => {
    const uploader = m.uploadedBy?.fullName ?? translate('family.someone');
    items.push({
      id: `m-${m._id}`,
      title: translate('family.uploaderUploadedAMemory', { uploader }),
      body: m.caption || translate('family.valueLikes', { value: getLikeCount(m) }),
      time: formatNotificationTime(m.createdAt),
      timestamp: new Date(m.createdAt).getTime(),
      icon: 'images-outline',
      avatar: m.uploadedBy?.avatar,
      actorName: uploader,
    });
  });

  return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 15);
}

export function buildFamilyAnalytics({ members, memories, events, messages, treeNodes }) {
  const uploadCounts = {};
  (memories ?? []).forEach((m) => {
    const id = getUploaderId(m);
    if (id) uploadCounts[id] = (uploadCounts[id] ?? 0) + 1;
  });
  const messageCounts = {};
  (messages ?? []).forEach((m) => {
    const id = getSenderId(m);
    if (id) messageCounts[id] = (messageCounts[id] ?? 0) + 1;
  });

  let topId = null;
  let topScore = 0;
  (members ?? []).forEach((m) => {
    const id = String(m._id);
    const score = (uploadCounts[id] ?? 0) * 2 + (messageCounts[id] ?? 0);
    if (score > topScore) {
      topScore = score;
      topId = id;
    }
  });

  const topMember = (members ?? []).find((m) => String(m._id) === topId);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const activityThisWeek =
    (memories ?? []).filter((m) => m.createdAt && new Date(m.createdAt) >= weekStart).length +
    (events ?? []).filter((e) => e.createdAt && new Date(e.createdAt) >= weekStart).length +
    (messages ?? []).filter((m) => m.createdAt && new Date(m.createdAt) >= weekStart).length;

  return {
    memberCount: members?.length ?? 0,
    mostActiveMember: topMember?.fullName ?? '—',
    mostActiveAvatar: topMember?.avatar,
    totalMemories: memories?.length ?? 0,
    totalEvents: events?.length ?? 0,
    totalMessages: messages?.length ?? 0,
    relationshipsMapped: (treeNodes ?? []).filter((n) => n.relationshipType !== 'other').length,
    activityThisWeek,
    memberGrowth: members?.length ?? 0,
  };
}

export function uiRelationshipToPayload(option, relatedToUserId) {
  return {
    relationshipType: option.backendType,
    nickname: option.nickname ?? option.label,
    relatedToUserId,
  };
}

export function findRelationshipOption(node) {
  if (!node) return null;
  return (
    RELATIONSHIP_OPTIONS.find(
      (r) =>
        r.backendType === node.relationshipType &&
        (node.nickname ? r.nickname === node.nickname || r.label === node.nickname : true),
    ) ?? RELATIONSHIP_OPTIONS.find((r) => r.backendType === node.relationshipType)
  );
}
