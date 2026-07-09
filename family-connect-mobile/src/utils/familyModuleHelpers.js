import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatNotificationTime, getNotificationIcon } from './notificationHelpers';
import { getUploaderId, getLikeCount } from './memoryHelpers';
import { guestEntryUserId } from './eventFormat';
import { getSenderId } from './chatHelpers';

/** UI relationship labels mapped to backend family-tree enums */
export const RELATIONSHIP_OPTIONS = [
  { id: 'father', label: 'Father', backendType: 'parent', nickname: 'Father' },
  { id: 'mother', label: 'Mother', backendType: 'parent', nickname: 'Mother' },
  { id: 'brother', label: 'Brother', backendType: 'sibling', nickname: 'Brother' },
  { id: 'sister', label: 'Sister', backendType: 'sibling', nickname: 'Sister' },
  { id: 'grandparent', label: 'Grandparent', backendType: 'grandparent' },
  { id: 'child', label: 'Child', backendType: 'child' },
  { id: 'guardian', label: 'Guardian', backendType: 'other', nickname: 'Guardian' },
  { id: 'relative', label: 'Relative', backendType: 'other', nickname: 'Relative' },
  { id: 'friend', label: 'Friend of family', backendType: 'other', nickname: 'Friend' },
];

export const ROLE_DEFINITIONS = [
  {
    id: 'owner',
    label: 'Owner',
    mapsFrom: 'admin',
    description: 'Family creator with full control. Cannot leave without transferring ownership.',
    permissions: ['All permissions', 'Regenerate invite', 'Manage relationships', 'Family settings'],
    readOnly: true,
  },
  {
    id: 'admin',
    label: 'Admin',
    mapsFrom: 'admin',
    description: 'Full family administration except ownership transfer.',
    permissions: ['Invite members', 'Regenerate invite code', 'Manage relationships'],
    readOnly: true,
  },
  {
    id: 'parent',
    label: 'Parent',
    mapsFrom: 'parent',
    description: 'Can create events, upload memories, and invite members.',
    permissions: ['Create events', 'Upload memories', 'View locations'],
    readOnly: true,
  },
  {
    id: 'member',
    label: 'Member',
    mapsFrom: 'member',
    description: 'Standard family participant.',
    permissions: ['Chat', 'RSVP events', 'View shared memories'],
    readOnly: true,
  },
  {
    id: 'child',
    label: 'Child',
    mapsFrom: 'child',
    description: 'Restricted experience with minor-mode protections.',
    permissions: ['Limited chat visibility', 'View family content'],
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
  if (!type || type === 'other') return 'Family member';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function isMemberOnline(lastSeen, locationUpdatedAt) {
  const ts = locationUpdatedAt || lastSeen;
  if (!ts) return false;
  return Date.now() - new Date(ts).getTime() < 15 * 60 * 1000;
}

export function formatLastActive(lastSeen) {
  if (!lastSeen) return 'Unknown';
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
      title: `${family.name} was created`,
      body: 'Your family home was established',
      time: formatNotificationTime(family.createdAt),
      timestamp: new Date(family.createdAt).getTime(),
      icon: 'home-outline',
    });
  }

  (members ?? []).forEach((m) => {
    if (String(m._id) === creatorId) return;
    items.push({
      id: `join-${m._id}`,
      title: `${m.fullName} joined the family`,
      body: 'Invite accepted',
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
    const uploader = m.uploadedBy?.fullName ?? 'Someone';
    items.push({
      id: `m-${m._id}`,
      title: `${uploader} uploaded a memory`,
      body: m.caption || `${getLikeCount(m)} likes`,
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
