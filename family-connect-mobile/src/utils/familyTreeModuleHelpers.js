import AsyncStorage from '@react-native-async-storage/async-storage';
import { findRelationshipOption } from './familyModuleHelpers';

const HISTORY_KEY = (familyId) => `fc_family_history_${familyId}`;
const TREE_SETTINGS_KEY = (familyId) => `fc_tree_settings_${familyId}`;
const ACHIEVEMENTS_KEY = (familyId) => `fc_tree_achievements_${familyId}`;

/** UI labels mapped to backend family-tree enums (extends family module options). */
export const TREE_RELATIONSHIP_OPTIONS = [
  { id: 'father', label: 'Father', backendType: 'parent', nickname: 'Father' },
  { id: 'mother', label: 'Mother', backendType: 'parent', nickname: 'Mother' },
  { id: 'brother', label: 'Brother', backendType: 'sibling', nickname: 'Brother' },
  { id: 'sister', label: 'Sister', backendType: 'sibling', nickname: 'Sister' },
  { id: 'grandparent', label: 'Grandparent', backendType: 'grandparent' },
  { id: 'grandchild', label: 'Grandchild', backendType: 'grandchild' },
  { id: 'guardian', label: 'Guardian', backendType: 'other', nickname: 'Guardian' },
  { id: 'spouse', label: 'Spouse', backendType: 'spouse' },
  { id: 'child', label: 'Child', backendType: 'child' },
  { id: 'relative', label: 'Relative', backendType: 'other', nickname: 'Relative' },
];

export const DEFAULT_TREE_SETTINGS = {
  showGenerationLabels: true,
  showNicknames: true,
  animateConnections: true,
  highlightPath: true,
  defaultZoom: 1,
  elderLargeNodes: false,
};

export const DEFAULT_FAMILY_HISTORY = {
  origins: '',
  traditions: '',
  culturalNotes: '',
  importantEvents: '',
  achievements: '',
  historicalMemories: '',
};

function normalizeName(name) {
  if (!name || name === 'undefined undefined') return null;
  return name.trim() || null;
}

/** Merge API tree nodes with family members for display names and missing nodes. */
export function enrichTreeNodes(treeNodes, members) {
  const memberMap = new Map((members ?? []).map((m) => [String(m._id), m]));
  const nodeIds = new Set((treeNodes ?? []).map((n) => String(n.id)));

  const enriched = (treeNodes ?? []).map((node) => {
    const member = memberMap.get(String(node.id));
    const name = normalizeName(node.name) ?? member?.fullName ?? 'Family member';
    return {
      ...node,
      id: String(node.id),
      name,
      fullName: name,
      avatar: node.avatar || member?.avatar || null,
      role: node.role ?? member?.role ?? 'member',
      relationshipLabel: findTreeRelationshipOption(node)?.label ?? node.nickname ?? 'Family member',
      relatedTo: node.relatedTo ? String(node.relatedTo) : null,
    };
  });

  (members ?? []).forEach((m) => {
    const id = String(m._id);
    if (!nodeIds.has(id)) {
      enriched.push({
        id,
        name: m.fullName,
        fullName: m.fullName,
        avatar: m.avatar,
        role: m.role,
        nickname: null,
        relationshipType: 'other',
        relatedTo: null,
        relatedToName: null,
        relationshipLabel: 'Family member',
        _synthetic: true,
      });
    }
  });

  return enriched;
}

export function findTreeRelationshipOption(node) {
  if (!node) return null;
  return (
    TREE_RELATIONSHIP_OPTIONS.find(
      (r) =>
        r.backendType === node.relationshipType &&
        (node.nickname ? r.nickname === node.nickname || r.label === node.nickname : true),
    ) ?? TREE_RELATIONSHIP_OPTIONS.find((r) => r.backendType === node.relationshipType)
  );
}

export function treeRelationshipToPayload(option, relatedToUserId) {
  return {
    relationshipType: option.backendType,
    nickname: option.nickname ?? option.label,
    relatedToUserId,
  };
}

/** Parent-child edges derived from relatedTo + relationshipType. */
export function buildAdjacency(nodes) {
  const childrenOf = new Map();
  const parentsOf = new Map();
  const spousesOf = new Map();
  const siblingsOf = new Map();

  (nodes ?? []).forEach((n) => {
    const id = String(n.id);
    if (!n.relatedTo) return;
    const rel = String(n.relatedTo);

    if (n.relationshipType === 'child' || n.relationshipType === 'grandchild') {
      if (!childrenOf.has(rel)) childrenOf.set(rel, []);
      childrenOf.get(rel).push(id);
      if (!parentsOf.has(id)) parentsOf.set(id, []);
      parentsOf.get(id).push(rel);
    } else if (n.relationshipType === 'parent' || n.relationshipType === 'grandparent') {
      if (!childrenOf.has(id)) childrenOf.set(id, []);
      childrenOf.get(id).push(rel);
      if (!parentsOf.has(rel)) parentsOf.set(rel, []);
      parentsOf.get(rel).push(id);
    } else if (n.relationshipType === 'spouse') {
      if (!spousesOf.has(rel)) spousesOf.set(rel, []);
      spousesOf.get(rel).push(id);
      if (!spousesOf.has(id)) spousesOf.set(id, []);
      spousesOf.get(id).push(rel);
    } else if (n.relationshipType === 'sibling') {
      if (!siblingsOf.has(rel)) siblingsOf.set(rel, []);
      siblingsOf.get(rel).push(id);
      if (!siblingsOf.has(id)) siblingsOf.set(id, []);
      siblingsOf.get(id).push(rel);
    }
  });

  return { childrenOf, parentsOf, spousesOf, siblingsOf };
}

export function computeGenerations(nodes) {
  const gens = {};
  const { childrenOf, parentsOf } = buildAdjacency(nodes);
  const ids = (nodes ?? []).map((n) => String(n.id));

  ids.forEach((id) => {
    gens[id] = 1;
  });

  const roots = ids.filter((id) => !(parentsOf.get(id)?.length));
  const queue = roots.map((id) => ({ id, gen: 0 }));
  const visited = new Set();

  while (queue.length) {
    const { id, gen } = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    gens[id] = Math.min(gens[id] ?? gen, gen);

    (childrenOf.get(id) ?? []).forEach((childId) => {
      queue.push({ id: childId, gen: gen + 1 });
    });
    (parentsOf.get(id) ?? []).forEach((parentId) => {
      queue.push({ id: parentId, gen: gen - 1 });
    });
  }

  const minGen = Math.min(...Object.values(gens), 0);
  Object.keys(gens).forEach((id) => {
    gens[id] -= minGen;
  });

  return gens;
}

export function getGenerationLabel(gen) {
  if (gen === 0) return 'Founders';
  if (gen === 1) return 'Parents';
  if (gen === 2) return 'Children';
  if (gen === 3) return 'Grandchildren';
  return `Generation ${gen + 1}`;
}

/** Layout positions for interactive canvas. */
export function layoutTree(nodes, collapsedIds = new Set()) {
  const gens = computeGenerations(nodes);
  const { spousesOf } = buildAdjacency(nodes);
  const byGen = new Map();

  const visible = (nodes ?? []).filter((n) => {
    const id = String(n.id);
    if (!n.relatedTo) return true;
    let p = String(n.relatedTo);
    while (p) {
      if (collapsedIds.has(p)) return false;
      const parent = nodes.find((x) => String(x.id) === p);
      p = parent?.relatedTo ? String(parent.relatedTo) : null;
    }
    return true;
  });

  visible.forEach((n) => {
    const g = gens[String(n.id)] ?? 0;
    if (!byGen.has(g)) byGen.set(g, []);
    byGen.get(g).push(n);
  });

  const NODE_W = 96;
  const NODE_H = 120;
  const GAP_X = 28;
  const GAP_Y = 100;
  const positions = {};
  const generations = [...byGen.keys()].sort((a, b) => a - b);

  generations.forEach((gen, row) => {
    const rowNodes = byGen.get(gen) ?? [];
    const placed = new Set();
    const ordered = [];

    rowNodes.forEach((n) => {
      const id = String(n.id);
      if (placed.has(id)) return;
      ordered.push(n);
      placed.add(id);
      (spousesOf.get(id) ?? []).forEach((sid) => {
        const spouse = rowNodes.find((x) => String(x.id) === sid);
        if (spouse && !placed.has(sid)) {
          ordered.push(spouse);
          placed.add(sid);
        }
      });
    });

    const rowWidth = ordered.length * (NODE_W + GAP_X) - GAP_X;
    ordered.forEach((n, col) => {
      positions[String(n.id)] = {
        x: col * (NODE_W + GAP_X) - rowWidth / 2 + NODE_W / 2,
        y: row * (NODE_H + GAP_Y),
        width: NODE_W,
        height: NODE_H,
        generation: gen,
      };
    });
  });

  const allX = Object.values(positions).map((p) => p.x);
  const allY = Object.values(positions).map((p) => p.y);
  const minX = Math.min(...allX, 0) - NODE_W;
  const maxX = Math.max(...allX, 0) + NODE_W;
  const maxY = Math.max(...allY, 0) + NODE_H;

  return {
    positions,
    generations: gens,
    canvasWidth: maxX - minX + NODE_W * 2,
    canvasHeight: maxY + NODE_H + GAP_Y,
    offsetX: -minX + NODE_W,
    nodeWidth: NODE_W,
    nodeHeight: NODE_H,
  };
}

export function getAncestors(nodeId, nodes, maxDepth = 4) {
  const { parentsOf } = buildAdjacency(nodes);
  const result = [];
  let current = [String(nodeId)];
  const seen = new Set(current);

  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const level = [];
    current.forEach((id) => {
      (parentsOf.get(id) ?? []).forEach((pid) => {
        if (!seen.has(pid)) {
          seen.add(pid);
          level.push(pid);
        }
      });
    });
    if (!level.length) break;
    const levelNodes = level.map((id) => nodes.find((n) => String(n.id) === id)).filter(Boolean);
    result.push({ depth, label: depth === 1 ? 'Parents' : depth === 2 ? 'Grandparents' : `Generation −${depth}`, members: levelNodes });
    current = level;
  }
  return result;
}

export function getDescendants(nodeId, nodes, maxDepth = 3) {
  const { childrenOf } = buildAdjacency(nodes);
  const result = [];
  let current = [String(nodeId)];
  const seen = new Set(current);

  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const level = [];
    current.forEach((id) => {
      (childrenOf.get(id) ?? []).forEach((cid) => {
        if (!seen.has(cid)) {
          seen.add(cid);
          level.push(cid);
        }
      });
    });
    if (!level.length) break;
    const levelNodes = level.map((id) => nodes.find((n) => String(n.id) === id)).filter(Boolean);
    result.push({
      depth,
      label: depth === 1 ? 'Children' : depth === 2 ? 'Grandchildren' : `Generation +${depth}`,
      members: levelNodes,
    });
    current = level;
  }
  return result;
}

export function getPersonRelations(nodeId, nodes) {
  const id = String(nodeId);
  const node = nodes.find((n) => String(n.id) === id);
  const { childrenOf, parentsOf, spousesOf, siblingsOf } = buildAdjacency(nodes);

  const pick = (ids) =>
    (ids ?? [])
      .map((x) => nodes.find((n) => String(n.id) === x))
      .filter(Boolean);

  return {
    node,
    parents: pick(parentsOf.get(id)),
    children: pick(childrenOf.get(id)),
    partner: pick(spousesOf.get(id)),
    siblings: pick(siblingsOf.get(id)),
  };
}

export function buildHeritageTimeline({ nodes, events, memories, legacyProfiles, achievements }) {
  const items = [];

  (nodes ?? []).forEach((n) => {
    if (n.dateOfBirth) {
      items.push({
        id: `birth-${n.id}`,
        type: 'birth',
        title: `${n.name} born`,
        date: n.dateOfBirth,
        memberId: n.id,
        icon: 'gift-outline',
      });
    }
    if (n.relationshipType === 'spouse' && n.relatedTo) {
      items.push({
        id: `marriage-${n.id}`,
        type: 'marriage',
        title: `${n.name} & ${n.relatedToName ?? 'partner'}`,
        date: n.joinedAt ?? null,
        memberId: n.id,
        icon: 'heart-outline',
      });
    }
  });

  (events ?? []).forEach((e) => {
    items.push({
      id: `event-${e._id}`,
      type: 'event',
      title: e.title,
      date: e.date ?? e.createdAt,
      body: e.description,
      icon: 'calendar-outline',
    });
  });

  (memories ?? []).slice(0, 30).forEach((m) => {
    items.push({
      id: `memory-${m._id}`,
      type: 'memory',
      title: m.caption || 'Family memory',
      date: m.createdAt,
      body: m.uploadedBy?.fullName,
      icon: 'images-outline',
    });
  });

  (legacyProfiles ?? []).forEach((p) => {
    items.push({
      id: `legacy-${p.memberId}`,
      type: 'legacy',
      title: `${p.displayName ?? 'Beloved member'} — legacy`,
      date: p.createdAt,
      body: p.story,
      memberId: p.memberId,
      icon: 'flower-outline',
    });
  });

  (achievements ?? []).forEach((a) => {
    items.push({
      id: `ach-${a.id}`,
      type: 'achievement',
      title: a.title,
      date: a.date,
      body: a.description,
      memberId: a.memberId,
      icon: 'trophy-outline',
    });
  });

  return items
    .filter((i) => i.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function buildTreeAnalytics(nodes, legacyProfiles) {
  const gens = computeGenerations(nodes);
  const genCount = new Set(Object.values(gens)).size;
  const { childrenOf, parentsOf, spousesOf, siblingsOf } = buildAdjacency(nodes);

  let mostConnectedId = null;
  let mostConnectedScore = 0;
  (nodes ?? []).forEach((n) => {
    const id = String(n.id);
    const score =
      (childrenOf.get(id)?.length ?? 0) +
      (parentsOf.get(id)?.length ?? 0) +
      (spousesOf.get(id)?.length ?? 0) +
      (siblingsOf.get(id)?.length ?? 0);
    if (score > mostConnectedScore) {
      mostConnectedScore = score;
      mostConnectedId = id;
    }
  });

  const mostConnected = nodes.find((n) => String(n.id) === mostConnectedId);
  const mapped = (nodes ?? []).filter((n) => n.relationshipType && n.relationshipType !== 'other').length;
  const total = nodes?.length ?? 0;

  return {
    generationCount: genCount,
    memberCount: total,
    relationshipCount: mapped,
    legacyProfileCount: legacyProfiles?.length ?? 0,
    mostConnectedMember: mostConnected?.name ?? '—',
    mostConnectedAvatar: mostConnected?.avatar,
    treeCompleteness: total ? Math.round((mapped / total) * 100) : 0,
  };
}

export function searchTree(nodes, { query = '', relationship = '', generation = '', branch = '' } = {}) {
  const gens = computeGenerations(nodes);
  const q = query.trim().toLowerCase();

  return (nodes ?? []).filter((n) => {
    if (q) {
      const hay = `${n.name} ${n.nickname ?? ''} ${n.relationshipLabel ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (relationship && n.relationshipType !== relationship && n.relationshipLabel !== relationship) {
      const opt = TREE_RELATIONSHIP_OPTIONS.find((r) => r.id === relationship);
      if (!opt || opt.backendType !== n.relationshipType) return false;
    }
    if (generation !== '' && generation != null) {
      if (gens[String(n.id)] !== Number(generation)) return false;
    }
    if (branch) {
      const ancestors = getAncestors(n.id, nodes, 10).flatMap((l) => l.members.map((m) => String(m.id)));
      if (!ancestors.includes(String(branch)) && String(n.id) !== String(branch)) {
        const desc = getDescendants(branch, nodes, 10).flatMap((l) => l.members.map((m) => String(m.id)));
        if (!desc.includes(String(n.id)) && String(n.id) !== String(branch)) return false;
      }
    }
    return true;
  });
}

export function getMemoriesForMember(memories, memberId) {
  const id = String(memberId);
  return (memories ?? []).filter((m) => {
    const uploader = m.uploadedBy?._id ?? m.uploadedBy;
    if (String(uploader) === id) return true;
    const tags = m.taggedMembers ?? m.tags ?? [];
    return tags.some((t) => String(t._id ?? t) === id);
  });
}

export function getEventsForMember(events, memberId) {
  const id = String(memberId);
  return (events ?? []).filter((e) => {
    const guests = e.guests ?? e.attendees ?? [];
    return guests.some((g) => String(g.userId?._id ?? g.userId ?? g) === id);
  });
}

export async function loadFamilyHistory(familyId) {
  if (!familyId) return { ...DEFAULT_FAMILY_HISTORY };
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY(familyId));
    return raw ? { ...DEFAULT_FAMILY_HISTORY, ...JSON.parse(raw) } : { ...DEFAULT_FAMILY_HISTORY };
  } catch {
    return { ...DEFAULT_FAMILY_HISTORY };
  }
}

export async function saveFamilyHistory(familyId, history) {
  if (!familyId) return;
  await AsyncStorage.setItem(HISTORY_KEY(familyId), JSON.stringify(history));
}

export async function loadTreeSettings(familyId) {
  if (!familyId) return { ...DEFAULT_TREE_SETTINGS };
  try {
    const raw = await AsyncStorage.getItem(TREE_SETTINGS_KEY(familyId));
    return raw ? { ...DEFAULT_TREE_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_TREE_SETTINGS };
  } catch {
    return { ...DEFAULT_TREE_SETTINGS };
  }
}

export async function saveTreeSettings(familyId, settings) {
  if (!familyId) return;
  await AsyncStorage.setItem(TREE_SETTINGS_KEY(familyId), JSON.stringify(settings));
}

export async function loadAchievements(familyId) {
  if (!familyId) return [];
  try {
    const raw = await AsyncStorage.getItem(ACHIEVEMENTS_KEY(familyId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveAchievements(familyId, items) {
  if (!familyId) return;
  await AsyncStorage.setItem(ACHIEVEMENTS_KEY(familyId), JSON.stringify(items));
}

export function getFamilyMilestones({ nodes, events, legacyProfiles }) {
  const milestones = [];
  if ((nodes ?? []).length >= 5) {
    milestones.push({ id: 'm-grow', title: 'Growing family', body: `${nodes.length} members in your tree`, icon: 'people' });
  }
  const mapped = (nodes ?? []).filter((n) => n.relationshipType !== 'other').length;
  if (mapped >= 3) {
    milestones.push({ id: 'm-rel', title: 'Connections mapped', body: `${mapped} relationships documented`, icon: 'git-network' });
  }
  if ((legacyProfiles ?? []).length) {
    milestones.push({ id: 'm-legacy', title: 'Legacy preserved', body: `${legacyProfiles.length} remembrance profiles`, icon: 'heart' });
  }
  if ((events ?? []).length) {
    milestones.push({ id: 'm-events', title: 'Shared history', body: `${events.length} family events on record`, icon: 'calendar' });
  }
  return milestones;
}
