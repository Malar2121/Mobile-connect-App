/**
 * Family Connect - demo data for the final-year demonstration video.
 *
 * Safety rules (checked before anything is written):
 *   - NODE_ENV must be "development"
 *   - the database must be on this computer (127.0.0.1 / localhost), never a
 *     cloud URI (mongodb+srv, Atlas, Railway)
 *   - demo mode must be confirmed with --demo-mode (the npm scripts add it)
 *   - only the two demo families and the @familyconnect.test demo accounts are
 *     touched; no other development data is read for writing or deleted
 *   - Arjun (demo.admin@familyconnect.test) and "The Perera Family" must already
 *     exist. They are created through the app's Register and Create Family
 *     screens, and this script never changes Arjun's password or deletes him.
 *
 * Usage (run inside the backend folder):
 *   npm run demo:seed     create or restore the demo data (safe to run again)
 *   npm run demo:verify   check the demo data and its relationships, change nothing
 *   npm run demo:reset    remove only the demo data (keeps Arjun and his family)
 *
 * Running demo:seed again restores the demo baseline (RSVPs, poll votes, pins),
 * but it does not delete anything added live in the app. For a completely clean
 * retake run demo:reset and then demo:seed.
 *
 * Photos: profile, event and memory images in backend/scripts/demo-media/ (file
 * names in its README.md) are uploaded to the project's own Cloudinary account.
 * Without them people show initials, events have no cover and the four
 * memories use placeholder photos from picsum.photos.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fs = require('fs');
const crypto = require('crypto');
const mongoose = require('mongoose');

const User = require('../models/User');
const Family = require('../models/Family');
const FamilyMember = require('../models/FamilyMember');
const Event = require('../models/Event');
const EventPoll = require('../models/EventPoll');
const Message = require('../models/Message');
const Memory = require('../models/Memory');
const Album = require('../models/Album');
const Notification = require('../models/Notification');
const Location = require('../models/Location');
const LocationHistory = require('../models/LocationHistory');
const Comment = require('../models/Comment');
const Story = require('../models/Story');
const SentReminder = require('../models/SentReminder');
const { resolveMongoUri } = require('../config/db');

// ─── Demo definition ──────────────────────────────────────────────────────
const PASSWORD = 'Demo@12345';
const ADMIN_EMAIL = 'demo.admin@familyconnect.test';
const FAMILY_A = 'The Perera Family';
const FAMILY_B = 'The Silva Family';

const SEEDED_USERS = [
  { key: 'nadeesha', fullName: 'Nadeesha Perera', email: 'demo.member1@familyconnect.test', memberType: 'adult', family: 'A' },
  { key: 'kavindu', fullName: 'Kavindu Perera', email: 'demo.member2@familyconnect.test', memberType: 'adult', family: 'A' },
  { key: 'kamala', fullName: 'Kamala Perera', email: 'demo.elder@familyconnect.test', memberType: 'elder', family: 'A' },
  { key: 'ravi', fullName: 'Ravi Silva', email: 'demo.outsider@familyconnect.test', memberType: 'adult', family: 'B' },
];

// Family tree. The app reads "relationshipType of relatedTo":
// Kamala is Arjun's mother, Arjun and Nadeesha are her children,
// Kavindu is Arjun's son. This gives three clean generations.
// Each member stores one link, so the tree is Kamala -> Arjun (+ Nadeesha) -> Kavindu.
// Kamala is the root with no link: pointing her back at Arjun would make a loop.
const TREE = {
  kamala: { relationshipType: 'parent', relatedTo: null, nickname: 'Mother' },
  arjun: { relationshipType: 'child', relatedTo: 'kamala', nickname: 'Son' },
  nadeesha: { relationshipType: 'spouse', relatedTo: 'arjun', nickname: 'Wife' },
  kavindu: { relationshipType: 'child', relatedTo: 'arjun', nickname: 'Son' },
};

// Dummy coordinates in public areas of Colombo - not anyone's real location.
// Arjun has none: his position comes live from the iPhone during the demo.
const LOCATIONS = {
  nadeesha: { latitude: 6.9108, longitude: 79.8612 },
  kavindu: { latitude: 6.8731, longitude: 79.8890 },
  kamala: { latitude: 6.9344, longitude: 79.8428 },
};

const CHAT = [
  { from: 'arjun', text: 'Hi everyone! Are we ready for the family gathering?' },
  { from: 'nadeesha', text: 'Yes, Saturday works for me.' },
  { from: 'kavindu', text: 'Saturday is good for me too.' },
  { from: 'kamala', text: 'Looking forward to seeing everyone.' },
  { from: 'arjun', text: 'I will share the event details here.', pinnedBy: 'arjun', starredBy: ['nadeesha'] },
  { from: 'nadeesha', text: 'Thank you!' },
  { from: 'kavindu', text: 'I can bring some food.', reactions: [['kamala', '❤️'], ['nadeesha', '👍']] },
  { from: 'arjun', text: 'Great idea.', replyTo: 6 },
  { from: 'kamala', text: 'Please bring the old family photos too.' },
  { from: 'nadeesha', text: 'Sure, I will add them to Family Moments.' },
];

const MEMORIES = [
  { key: 'memory-family-dinner', caption: 'Family Dinner', by: 'nadeesha', tags: ['arjun', 'kamala'], likes: ['arjun', 'kavindu'], hoursAgo: 2 },
  { key: 'memory-weekend-trip', caption: 'Weekend Trip', by: 'arjun', tags: ['kavindu'], likes: ['nadeesha'], hoursAgo: 26 },
  { key: 'memory-new-year', caption: 'New Year Celebration', by: 'kavindu', tags: [], likes: ['kamala', 'arjun'], hoursAgo: 74 },
  { key: 'memory-family-gathering', caption: 'Family Gathering', by: 'kamala', tags: ['nadeesha'], likes: ['nadeesha'], hoursAgo: 5 },
];
// Cover photo file in demo-media/ for each demo event.
const EVENT_IMAGES = {
  'Family Weekend Gathering': 'event-family-weekend',
  'Family Picnic': 'event-family-picnic',
};
const MEDIA_DIR = path.join(__dirname, 'demo-media');
const ALBUM_TITLE = 'Family Moments';

// ─── Small helpers ────────────────────────────────────────────────────────
const id = (x) => String(x?._id ?? x);
// Family names are compared without caring about capital letters or extra
// spaces, so "The Perera family" typed in the app matches "The Perera Family".
const sameName = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();
const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000);
const minutesAgo = (m) => new Date(Date.now() - m * 60 * 1000);

function atTime(date, hh, mm = 0) {
  const d = new Date(date);
  d.setHours(hh, mm, 0, 0);
  return d;
}

function nextSaturday(minDaysAhead) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + minDaysAhead);
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function uniqueInviteCode() {
  // Same format as familyController.makeInviteCode (e.g. "3FA9-0C1B")
  for (let i = 0; i < 5; i += 1) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    const code = `${raw.slice(0, 4)}-${raw.slice(4)}`;
    if (!(await Family.exists({ inviteCode: code }))) return code;
  }
  throw new Error('Could not generate a unique invite code');
}

// Save a new document keeping the createdAt/updatedAt given here.
async function createWithTime(Model, doc, when) {
  const d = new Model({ ...doc, createdAt: when, updatedAt: when });
  await d.save({ timestamps: false });
  return d;
}

const stats = { created: 0, updated: 0, unchanged: 0 };

// ─── Safety check ─────────────────────────────────────────────────────────
function checkSafety() {
  const uri = resolveMongoUri();
  const problems = [];
  const demoMode = process.argv.includes('--demo-mode') || process.env.DEMO_MODE === 'true';

  if (!demoMode) problems.push('Demo mode is not confirmed. Run it with "npm run demo:seed" (it adds --demo-mode).');
  if (process.env.NODE_ENV !== 'development') {
    problems.push(`NODE_ENV must be "development" (it is "${process.env.NODE_ENV || 'not set'}").`);
  }
  if (/^mongodb\+srv:/i.test(uri)) problems.push('Cloud database addresses (mongodb+srv) are refused.');
  if (/railway|mongodb\.net|atlas/i.test(uri)) problems.push('The database address looks like a cloud or production database.');

  const match = uri.match(/^mongodb:\/\/(?:[^@/]*@)?([^/?]+)/i);
  const hosts = match ? match[1].split(',') : [];
  const isLocal = hosts.length === 1 && /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i.test(hosts[0]);
  if (!isLocal) problems.push(`The database must be on this computer (127.0.0.1 or localhost). Found: "${match ? match[1] : 'unknown'}".`);

  return { uri, problems, host: hosts[0] || 'unknown' };
}

// ─── Load the account and family made through the app ──────────────────────
async function loadAdminAndFamily() {
  const arjun = await User.findOne({ email: ADMIN_EMAIL });
  if (!arjun) {
    throw new Error(`${ADMIN_EMAIL} was not found. Register Arjun Perera in the app first. Nothing was changed.`);
  }
  if (!arjun.familyId) {
    throw new Error(`Arjun has no family yet. Create "${FAMILY_A}" in the app first. Nothing was changed.`);
  }
  const familyA = await Family.findById(arjun.familyId);
  if (!familyA) {
    throw new Error("Arjun's family record was not found. Nothing was changed.");
  }
  if (!sameName(familyA.name, FAMILY_A)) {
    throw new Error(`Arjun's family is called "${familyA.name}", expected "${FAMILY_A}". Nothing was changed.`);
  }
  if (id(familyA.createdBy) !== id(arjun)) {
    throw new Error(`"${familyA.name}" was not created by Arjun. Nothing was changed.`);
  }
  return { arjun, familyA };
}

// ─── Users and families ───────────────────────────────────────────────────
async function preflightUsers(familyA) {
  const ravi = await User.findOne({ email: 'demo.outsider@familyconnect.test' });
  const familyB = ravi ? await Family.findOne({ name: FAMILY_B, createdBy: ravi._id }) : null;
  const allowed = new Set([id(familyA), familyB ? id(familyB) : null].filter(Boolean));

  for (const spec of SEEDED_USERS) {
    const u = await User.findOne({ email: spec.email });
    if (u && u.familyId && !allowed.has(id(u.familyId))) {
      throw new Error(`${spec.email} already belongs to another family. Nothing was changed.`);
    }
  }
}

async function ensureUsers() {
  const users = {};
  for (const spec of SEEDED_USERS) {
    let u = await User.findOne({ email: spec.email });
    if (!u) {
      u = await User.create({
        fullName: spec.fullName,
        email: spec.email,
        password: PASSWORD, // hashed by the User model's pre-save hook
        role: 'member',
        memberType: spec.memberType,
        elderMode: spec.memberType === 'elder',
      });
      stats.created += 1;
      console.log(`  + user ${spec.fullName} <${spec.email}>`);
    } else {
      const res = await User.updateOne(
        { _id: u._id },
        { $set: { fullName: spec.fullName, memberType: spec.memberType, elderMode: spec.memberType === 'elder', isActive: true } },
      );
      stats[res.modifiedCount ? 'updated' : 'unchanged'] += 1;
    }
    users[spec.key] = u;
  }
  return users;
}

async function addToFamily(user, family, role, joinedVia, tree = {}) {
  await Family.updateOne({ _id: family._id }, { $addToSet: { members: user._id } });
  await User.updateOne({ _id: user._id }, { $set: { familyId: family._id, role } });
  await FamilyMember.findOneAndUpdate(
    { family: family._id, user: user._id },
    {
      $set: {
        role,
        isActive: true,
        relationshipType: tree.relationshipType ?? 'other',
        relatedTo: tree.relatedTo ?? null,
        ...(tree.nickname ? { nickname: tree.nickname } : {}),
      },
      $setOnInsert: { joinedVia, joinedAt: new Date() },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function ensureFamilies(arjun, familyA, users) {
  const all = { arjun, ...users };
  const treeFor = (key) => {
    const t = TREE[key];
    return t ? { ...t, relatedTo: t.relatedTo ? all[t.relatedTo]._id : null } : {};
  };

  // Family A: Arjun stays admin (as created in the app); the others join as members.
  await FamilyMember.findOneAndUpdate(
    { family: familyA._id, user: arjun._id },
    {
      $set: { role: 'admin', isActive: true, relationshipType: TREE.arjun.relationshipType, relatedTo: users.kamala._id, nickname: TREE.arjun.nickname },
      $setOnInsert: { joinedVia: 'creator', joinedAt: new Date() },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  for (const key of ['nadeesha', 'kavindu', 'kamala']) {
    await addToFamily(users[key], familyA, 'member', 'invite_code', treeFor(key));
  }

  // Family B: a separate family for the optional isolation check.
  let familyB = await Family.findOne({ name: FAMILY_B, createdBy: users.ravi._id });
  if (!familyB) {
    familyB = await Family.create({
      name: FAMILY_B,
      createdBy: users.ravi._id,
      members: [users.ravi._id],
      inviteCode: await uniqueInviteCode(),
    });
    stats.created += 1;
    console.log(`  + family ${FAMILY_B}`);
  }
  await addToFamily(users.ravi, familyB, 'admin', 'creator');
  return familyB;
}

// ─── Events and poll ──────────────────────────────────────────────────────
// Uploads the event's cover once; returns {} when there is no file or it is already set.
async function eventImageFields(familyId, title) {
  const key = EVENT_IMAGES[title];
  if (!key || !findLocalMedia(key)) return {};
  const existing = await Event.findOne({ familyId, title }).select('image');
  if (isDemoMedia(existing?.image, key)) return {};
  const media = await resolveMedia(key);
  console.log(`  ~ event ${title}: cover photo`);
  return { image: media.url };
}

async function upsertEvent(familyId, title, fields) {
  const existing = await Event.findOne({ familyId, title });
  if (existing) {
    existing.set(fields);
    await existing.save();
    stats.updated += 1;
    return existing;
  }
  const created = await Event.create({ familyId, title, ...fields });
  stats.created += 1;
  console.log(`  + event ${title}`);
  return created;
}

async function ensureEvents(familyA, familyB, all) {
  const gatheringDay = nextSaturday(4);
  const picnicDay = addDays(gatheringDay, 15); // a Sunday two weeks later

  const gathering = await upsertEvent(familyA._id, 'Family Weekend Gathering', {
    description: 'Family gathering and dinner for everyone.',
    createdBy: all.arjun._id,
    date: gatheringDay,
    startTime: '17:00',
    endTime: '21:00',
    location: 'Perera family home, Colombo',
    ...(await eventImageFields(familyA._id, 'Family Weekend Gathering')),
    // Arjun stays "pending" and has not voted, so he can respond live in the demo.
    guests: [
      { userId: all.arjun._id, status: 'pending' },
      { userId: all.nadeesha._id, status: 'accepted' },
      { userId: all.kavindu._id, status: 'maybe' },
      { userId: all.kamala._id, status: 'accepted' },
    ],
  });

  const picnic = await upsertEvent(familyA._id, 'Family Picnic', {
    description: 'A relaxed picnic day with games and lunch.',
    createdBy: all.nadeesha._id,
    date: picnicDay,
    startTime: '10:00',
    endTime: '14:00',
    location: 'Viharamahadevi Park, Colombo',
    ...(await eventImageFields(familyA._id, 'Family Picnic')),
    guests: [
      { userId: all.nadeesha._id, status: 'accepted' },
      { userId: all.arjun._id, status: 'pending' },
      { userId: all.kavindu._id, status: 'pending' },
      { userId: all.kamala._id, status: 'pending' },
    ],
  });

  // Poll: three options around the gathering, left OPEN. Deadline is the day before.
  const friday = atTime(addDays(gatheringDay, -1), 18);
  const saturday = atTime(gatheringDay, 15);
  const sunday = atTime(addDays(gatheringDay, 1), 10);
  const v = (key, vote) => ({ user: all[key]._id, vote, votedAt: hoursAgo(3) });
  const pollFields = {
    createdBy: all.arjun._id,
    question: 'Which time works best for the family gathering?',
    options: [
      { dateTime: friday, label: 'Friday Evening', votes: [v('nadeesha', 'no'), v('kamala', 'maybe')] },
      { dateTime: saturday, label: 'Saturday Afternoon', votes: [v('nadeesha', 'yes'), v('kavindu', 'yes'), v('kamala', 'maybe')] },
      { dateTime: sunday, label: 'Sunday Morning', votes: [v('kavindu', 'maybe'), v('kamala', 'yes')] },
    ],
    deadline: atTime(addDays(gatheringDay, -1), 23, 59),
    isClosed: false,
    selectedOption: null,
  };
  let poll = await EventPoll.findOne({ event: gathering._id, family: familyA._id });
  if (poll) {
    poll.set(pollFields);
    await poll.save();
    stats.updated += 1;
  } else {
    poll = await EventPoll.create({ event: gathering._id, family: familyA._id, ...pollFields });
    stats.created += 1;
    console.log('  + poll on Family Weekend Gathering');
  }
  if (id(gathering.poll) !== id(poll)) {
    gathering.poll = poll._id;
    await gathering.save();
  }

  // Family B: one small event only.
  await upsertEvent(familyB._id, 'Silva Family Lunch', {
    description: 'Sunday lunch at home.',
    createdBy: all.ravi._id,
    date: addDays(nextSaturday(2), 1),
    startTime: '12:30',
    endTime: '14:30',
    location: 'Silva family home',
    guests: [{ userId: all.ravi._id, status: 'accepted' }],
  });

  return { gathering, picnic, poll };
}

// ─── Chat ─────────────────────────────────────────────────────────────────
async function ensureChat(familyA, familyB, all) {
  const members = ['arjun', 'nadeesha', 'kavindu', 'kamala'].map((k) => all[k]._id);
  const docs = [];

  for (let i = 0; i < CHAT.length; i += 1) {
    const line = CHAT[i];
    const sender = all[line.from];
    let msg = await Message.findOne({ familyId: familyA._id, sender: sender._id, text: line.text });
    if (!msg) {
      msg = await createWithTime(
        Message,
        {
          familyId: familyA._id,
          sender: sender._id,
          text: line.text,
          readBy: members,
          replyTo: line.replyTo !== undefined ? docs[line.replyTo]._id : null,
        },
        minutesAgo((CHAT.length - i) * 9 + 30),
      );
      stats.created += 1;
    } else {
      stats.unchanged += 1;
    }
    docs.push(msg);
  }

  // Restore pins, stars and reactions to the demo baseline (no timestamp change).
  for (let i = 0; i < CHAT.length; i += 1) {
    const line = CHAT[i];
    await Message.updateOne(
      { _id: docs[i]._id },
      {
        $set: {
          pinnedAt: line.pinnedBy ? docs[i].createdAt : null,
          pinnedBy: line.pinnedBy ? all[line.pinnedBy]._id : null,
          starredBy: (line.starredBy ?? []).map((k) => all[k]._id),
          reactions: (line.reactions ?? []).map(([k, emoji]) => ({ userId: all[k]._id, emoji })),
        },
      },
      { timestamps: false },
    );
  }
  console.log(`  chat: ${CHAT.length} demo messages in ${FAMILY_A}`);

  const welcome = { familyId: familyB._id, sender: all.ravi._id, text: 'Welcome to the Silva family space.' };
  if (!(await Message.exists(welcome))) {
    await createWithTime(Message, { ...welcome, readBy: [all.ravi._id] }, hoursAgo(20));
    stats.created += 1;
  }
}

// ─── Memories and album ───────────────────────────────────────────────────
function findLocalMedia(key) {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const p = path.join(MEDIA_DIR, `${key}.${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// True when url is the Cloudinary copy the seed uploaded for demo-media/<key>.
const isDemoMedia = (url, key) => String(url ?? '').includes(`family_connect/demo/${key}`);

async function resolveMedia(key, transformation = [{ width: 1280, crop: 'limit' }]) {
  const local = findLocalMedia(key);
  if (!local) {
    return { url: `https://picsum.photos/seed/familyconnect-${key}/800/600`, bytes: 0, source: 'placeholder' };
  }
  // Same Cloudinary account the app uses for real uploads (config/cloudinary.js).
  const { cloudinary } = require('../config/cloudinary');
  const res = await cloudinary.uploader.upload(local, {
    public_id: `family_connect/demo/${key}`,
    overwrite: true,
    resource_type: 'image',
    transformation,
  });
  return { url: res.secure_url, bytes: res.bytes || 0, source: 'cloudinary' };
}

async function ensureMemories(familyA, all) {
  let album = await Album.findOne({ family: familyA._id, title: ALBUM_TITLE });
  if (!album) {
    album = await Album.create({
      family: familyA._id,
      createdBy: all.nadeesha._id,
      title: ALBUM_TITLE,
      description: 'Our favourite family moments.',
    });
    stats.created += 1;
    console.log(`  + album ${ALBUM_TITLE}`);
  }

  const memories = [];
  for (const m of MEMORIES) {
    let memory = await Memory.findOne({ familyId: familyA._id, caption: m.caption });
    const baseline = {
      uploadedBy: all[m.by]._id,
      mediaType: 'image',
      album: id(album),
      tags: m.tags.map((k) => all[k]._id),
      likes: m.likes.map((k) => all[k]._id),
      status: 'approved',
    };

    if (!memory) {
      const media = await resolveMedia(m.key);
      memory = await createWithTime(
        Memory,
        { familyId: familyA._id, caption: m.caption, mediaUrl: media.url, bytes: media.bytes, ...baseline },
        hoursAgo(m.hoursAgo),
      );
      stats.created += 1;
      console.log(`  + memory ${m.caption} (${media.source} photo)`);
    } else {
      const set = { ...baseline };
      // Upgrade a placeholder photo once a real one has been added to demo-media/.
      if (/picsum\.photos/.test(memory.mediaUrl) && findLocalMedia(m.key)) {
        const media = await resolveMedia(m.key);
        set.mediaUrl = media.url;
        set.bytes = media.bytes;
        console.log(`  ~ memory ${m.caption}: placeholder replaced with your photo`);
      }
      await Memory.updateOne({ _id: memory._id }, { $set: set }, { timestamps: false });
      stats.updated += 1;
    }
    memories.push(memory);
  }

  await Album.updateOne(
    { _id: album._id },
    { $set: { coverMemory: memories[0]._id, mediaCount: memories.length, isShared: false } },
  );
  return { album, memories };
}

// ─── Notifications and locations ──────────────────────────────────────────
async function ensureNotifications(familyA, all, events, memories) {
  const specs = [
    ['nadeesha', 'event_created', 'New family event', 'Arjun added Family Weekend Gathering.', { eventId: id(events.gathering) }, false, 6],
    ['kavindu', 'event_created', 'New family event', 'Arjun added Family Weekend Gathering.', { eventId: id(events.gathering) }, false, 6],
    ['kamala', 'event_created', 'New family event', 'Arjun added Family Weekend Gathering.', { eventId: id(events.gathering) }, false, 6],
    ['nadeesha', 'event_created', 'Vote for the gathering time', 'Choose the best time for Family Weekend Gathering.', { eventId: id(events.gathering) }, true, 5],
    ['arjun', 'event_created', 'New family event', 'Nadeesha added Family Picnic.', { eventId: id(events.picnic) }, false, 4],
    ['arjun', 'memory_uploaded', 'New family memory', 'Nadeesha shared Family Dinner.', { memoryId: id(memories[0]) }, false, 2],
    ['arjun', 'chat_message', 'New message from Kavindu', 'I can bring some food.', {}, true, 1],
    ['kamala', 'chat_message', 'New message from Arjun', 'Great idea.', {}, false, 1],
  ];

  for (const [who, type, title, body, data, isRead, hrs] of specs) {
    const key = { recipient: all[who]._id, familyId: familyA._id, type, title, body };
    if (await Notification.exists(key)) {
      stats.unchanged += 1;
      continue;
    }
    await createWithTime(Notification, { ...key, data, isRead }, hoursAgo(hrs));
    stats.created += 1;
  }
}

async function ensureLocations(familyA, all) {
  for (const [key, pos] of Object.entries(LOCATIONS)) {
    await Location.findOneAndUpdate(
      { userId: all[key]._id },
      { $set: { familyId: familyA._id, latitude: pos.latitude, longitude: pos.longitude, accuracy: 15, isSharing: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
}

// ─── Profile photos ───────────────────────────────────────────────────────
// User.avatar is the one field every screen reads (chat, events, tree, ...),
// so one photo per person here shows the same face everywhere in the app.
const AVATAR_KEYS = ['arjun', 'nadeesha', 'kavindu', 'kamala'];
const avatarFile = (key) => `avatar-${key}`;
const isDemoAvatar = (url, key) => isDemoMedia(url, avatarFile(key));

async function ensureAvatars(all) {
  for (const key of AVATAR_KEYS) {
    const u = all[key];
    // No photo file: leave the account as it is (the app shows initials).
    if (!findLocalMedia(avatarFile(key)) || isDemoAvatar(u.avatar, key)) continue;
    const media = await resolveMedia(avatarFile(key), [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]);
    await User.updateOne({ _id: u._id }, { $set: { avatar: media.url } });
    u.avatar = media.url;
    stats.updated += 1;
    console.log(`  ~ profile photo for ${u.fullName}`);
  }
}

// ─── Seed ─────────────────────────────────────────────────────────────────
async function seed() {
  const { arjun, familyA } = await loadAdminAndFamily();
  console.log(`\nUsing "${familyA.name}" (invite code ${familyA.inviteCode}), created in the app by Arjun.`);
  await preflightUsers(familyA);

  console.log('\nSeeding demo data...');
  const users = await ensureUsers();
  const familyB = await ensureFamilies(arjun, familyA, users);
  const all = { arjun, ...users };
  await ensureAvatars(all);
  const events = await ensureEvents(familyA, familyB, all);
  await ensureChat(familyA, familyB, all);
  const { memories } = await ensureMemories(familyA, all);
  await ensureNotifications(familyA, all, events, memories);
  await ensureLocations(familyA, all);

  console.log(`\nDone: ${stats.created} created, ${stats.updated} restored to the demo baseline, ${stats.unchanged} already in place.`);
  if (!MEMORIES.every((m) => findLocalMedia(m.key))) {
    console.log(`Note: memories use placeholder photos. For real photos add ${MEMORIES.map((m) => `${m.key}.jpg`).join(', ')} to:\n  ${MEDIA_DIR}\nthen run npm run demo:seed again.`);
  }
  const missingAvatars = AVATAR_KEYS.filter((k) => !findLocalMedia(avatarFile(k)));
  if (missingAvatars.length) {
    console.log(`Note: no profile photo yet for ${missingAvatars.join(', ')} (shown as initials). Add ${missingAvatars.map((k) => `${avatarFile(k)}.jpg`).join(', ')} to demo-media/.`);
  }
}

// ─── Verify (read-only) ───────────────────────────────────────────────────
async function verify() {
  let failures = 0;
  const check = (ok, text) => {
    if (!ok) failures += 1;
    console.log(`  [${ok ? 'OK' : 'FAIL'}] ${text}`);
  };

  console.log('\nVerifying demo data...');
  const arjun = await User.findOne({ email: ADMIN_EMAIL }).select('+password');
  check(Boolean(arjun), 'Arjun exists (registered in the app)');
  if (!arjun) return false;
  check(arjun.role === 'admin' && !arjun.twoFactorEnabled, 'Arjun is family admin, two-factor login is off');
  check(await arjun.comparePassword(PASSWORD), 'Arjun signs in with Demo@12345');

  const familyA = await Family.findById(arjun.familyId);
  check(Boolean(familyA) && sameName(familyA.name, FAMILY_A), `Arjun belongs to ${FAMILY_A}`);
  if (!familyA) return false;
  const arjunFamilies = await Family.find({ createdBy: arjun._id });
  check(arjunFamilies.filter((f) => sameName(f.name, FAMILY_A)).length === 1, `exactly one ${FAMILY_A} (no duplicate)`);
  check(Boolean(familyA.inviteCode), `invite code exists (${familyA.inviteCode})`);

  const users = {};
  for (const spec of SEEDED_USERS) users[spec.key] = await User.findOne({ email: spec.email }).select('+password');
  const all = { arjun, ...users };
  const aKeys = ['arjun', 'nadeesha', 'kavindu', 'kamala'];
  const aIds = new Set(aKeys.filter((k) => all[k]).map((k) => id(all[k])));

  for (const key of aKeys) {
    const u = all[key];
    const fm = u ? await FamilyMember.findOne({ family: familyA._id, user: u._id }) : null;
    check(
      Boolean(u) && id(u.familyId) === id(familyA) && familyA.members.some((m) => id(m) === id(u)) && Boolean(fm),
      `${u?.fullName ?? key}: user -> family -> membership record`,
    );
    if (u && key !== 'arjun') check(await u.comparePassword(PASSWORD), `${u.fullName} signs in with Demo@12345`);
  }
  check(familyA.members.length === 4, `${FAMILY_A} has 4 members (found ${familyA.members.length})`);
  check(users.kamala?.memberType === 'elder' && users.kamala?.elderMode === true, 'Kamala is an elder account (memberType elder, elderMode on)');

  const tree = await FamilyMember.find({ family: familyA._id });
  check(tree.every((m) => !m.relatedTo || aIds.has(id(m.relatedTo))), 'family tree: every relationship points to a Perera family member');
  check(tree.filter((m) => m.relatedTo).length >= 3, 'family tree: relationships set for the family');
  const linkOf = new Map(tree.map((m) => [id(m.user), m.relatedTo ? id(m.relatedTo) : null]));
  const hasLoop = [...linkOf.keys()].some((start) => {
    const seen = new Set();
    for (let p = start; p; p = linkOf.get(p)) {
      if (seen.has(p)) return true;
      seen.add(p);
    }
    return false;
  });
  check(!hasLoop, 'family tree: no relationship loops');
  const linkIs = (key, type, to) => {
    const m = all[key] && tree.find((x) => id(x.user) === id(all[key]));
    return Boolean(m) && m.relationshipType === type && (to ? id(m.relatedTo) === id(all[to]) : !m.relatedTo);
  };
  check(
    linkIs('kamala', 'parent', null) && linkIs('arjun', 'child', 'kamala') && linkIs('nadeesha', 'spouse', 'arjun') && linkIs('kavindu', 'child', 'arjun'),
    'family tree: Kamala -> Arjun + Nadeesha (spouse) -> Kavindu',
  );

  const withPhoto = AVATAR_KEYS.filter((k) => findLocalMedia(avatarFile(k)));
  if (withPhoto.length) {
    check(withPhoto.every((k) => isDemoAvatar(all[k]?.avatar, k)), `profile photos: ${withPhoto.length} of 4 set from demo-media`);
  }
  const avatars = aKeys.map((k) => all[k]?.avatar).filter(Boolean);
  check(new Set(avatars).size === avatars.length, 'profile photos: no two family members share a photo');

  const familyB = users.ravi ? await Family.findOne({ name: FAMILY_B, createdBy: users.ravi._id }) : null;
  check(Boolean(familyB) && id(users.ravi.familyId) === id(familyB), `Ravi belongs to ${FAMILY_B}`);
  check(Boolean(users.ravi) && !familyA.members.some((m) => id(m) === id(users.ravi)), `Ravi is NOT in ${FAMILY_A}`);

  const events = await Event.find({ familyId: familyA._id });
  const gathering = events.find((e) => e.title === 'Family Weekend Gathering');
  check(events.filter((e) => e.title === 'Family Weekend Gathering').length === 1 && events.filter((e) => e.title === 'Family Picnic').length === 1, 'events: one Family Weekend Gathering, one Family Picnic');
  check(Boolean(gathering) && gathering.date > new Date(), 'Family Weekend Gathering is in the future');
  check(events.every((e) => e.guests.every((g) => aIds.has(id(g.userId)))), 'event guests are all Perera family members');
  for (const [title, key] of Object.entries(EVENT_IMAGES)) {
    if (!findLocalMedia(key)) continue;
    const ev = events.find((e) => e.title === title);
    check(Boolean(ev) && isDemoMedia(ev.image, key), `event cover: ${title} uses ${key}`);
  }

  const poll = gathering ? await EventPoll.findOne({ event: gathering._id }) : null;
  check(Boolean(poll) && id(gathering.poll) === id(poll) && id(poll.family) === id(familyA), 'poll is linked to the gathering and the family');
  check(Boolean(poll) && !poll.isClosed && poll.deadline > new Date() && poll.options.length === 3, 'poll is open, deadline in the future, 3 options');
  check(Boolean(poll) && poll.options.every((o) => o.votes.every((vt) => aIds.has(id(vt.user)))), 'poll votes come from Perera family members');

  const messages = await Message.find({ familyId: familyA._id });
  check(messages.length >= CHAT.length, `chat: ${messages.length} messages in ${FAMILY_A}`);
  check(messages.every((m) => aIds.has(id(m.sender))), 'chat: every sender is a Perera family member');
  const replies = messages.filter((m) => m.replyTo);
  check(replies.every((m) => messages.some((p) => id(p) === id(m.replyTo))), 'chat: replies point to real messages');
  check(messages.filter((m) => m.pinnedAt).length >= 1, 'chat: a pinned message exists');

  const album = await Album.findOne({ family: familyA._id, title: ALBUM_TITLE });
  const memories = await Memory.find({ familyId: familyA._id, caption: { $in: MEMORIES.map((m) => m.caption) } });
  check(Boolean(album), `album ${ALBUM_TITLE} exists`);
  check(memories.length === MEMORIES.length, `memories: ${memories.length} of ${MEMORIES.length} (no duplicates)`);
  check(memories.every((m) => m.status === 'approved' && album && m.album === id(album)), 'memories are approved and filed in the album');
  check(Boolean(album) && memories.some((m) => id(m) === id(album.coverMemory)), 'album cover is one of its memories');
  check(memories.every((m) => /^https:\/\//.test(m.mediaUrl)), 'memory photos have https addresses');
  for (const spec of MEMORIES) {
    if (!findLocalMedia(spec.key)) continue;
    const mem = memories.find((m) => m.caption === spec.caption);
    check(Boolean(mem) && isDemoMedia(mem.mediaUrl, spec.key), `memory photo: ${spec.caption} uses ${spec.key}`);
  }

  // Every stored demo image address must actually load, so nothing shows as broken in the app.
  const imageUrls = [
    ...aKeys.map((k) => all[k]?.avatar),
    ...events.map((e) => e.image),
    ...memories.map((m) => m.mediaUrl),
  ].filter(Boolean);
  const broken = [];
  for (const url of imageUrls) {
    try {
      // Some hosts (picsum.photos) refuse HEAD, so fall back to a normal request.
      let res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      if (!res.ok) {
        res = await fetch(url, { redirect: 'follow' });
        await res.body?.cancel();
      }
      if (!res.ok || !String(res.headers.get('content-type')).startsWith('image/')) broken.push(url);
    } catch {
      broken.push(url);
    }
  }
  check(broken.length === 0, `images: all ${imageUrls.length} stored image addresses load${broken.length ? ` (broken: ${broken.join(', ')})` : ''}`);

  const notes = await Notification.find({ familyId: familyA._id });
  check(notes.length > 0 && notes.every((n) => aIds.has(id(n.recipient))), `notifications: ${notes.length}, all for Perera family members`);

  const locs = await Location.find({ familyId: familyA._id });
  check(locs.every((l) => aIds.has(id(l.userId))), `locations: ${locs.length}, all for Perera family members`);

  if (users.ravi) {
    const isolation = await Promise.all([
      Event.countDocuments({ familyId: familyA._id, 'guests.userId': users.ravi._id }),
      Message.countDocuments({ familyId: familyA._id, sender: users.ravi._id }),
    ]);
    check(isolation.every((n) => n === 0), `no ${FAMILY_B} data inside ${FAMILY_A}`);
  }

  console.log(failures ? `\n${failures} check(s) FAILED.` : '\nAll checks passed.');
  return failures === 0;
}

// ─── Reset (demo data only) ───────────────────────────────────────────────
async function reset() {
  const arjun = await User.findOne({ email: ADMIN_EMAIL });
  let familyA = arjun?.familyId ? await Family.findById(arjun.familyId) : null;
  if (familyA && (!sameName(familyA.name, FAMILY_A) || id(familyA.createdBy) !== id(arjun))) familyA = null;

  const seeded = await User.find({ email: { $in: SEEDED_USERS.map((u) => u.email) } });
  const seededIds = seeded.map((u) => u._id);
  const ravi = seeded.find((u) => u.email === 'demo.outsider@familyconnect.test');
  const familyB = ravi ? await Family.findOne({ name: FAMILY_B, createdBy: ravi._id }) : null;

  // Seeded users must not belong to any family other than the two demo ones.
  const allowed = new Set([familyA, familyB].filter(Boolean).map(id));
  const outsider = seeded.find((u) => u.familyId && !allowed.has(id(u.familyId)));
  if (outsider) throw new Error(`${outsider.email} belongs to a non-demo family. Nothing was deleted.`);

  const familyIds = [familyA, familyB].filter(Boolean).map((f) => f._id);
  console.log(`\nRemoving demo data from: ${[familyA && FAMILY_A, familyB && FAMILY_B].filter(Boolean).join(', ') || 'no demo family found'}`);

  const removed = {};
  const del = async (name, Model, filter) => {
    removed[name] = (await Model.deleteMany(filter)).deletedCount;
  };
  await del('events', Event, { familyId: { $in: familyIds } });
  await del('polls', EventPoll, { family: { $in: familyIds } });
  await del('messages', Message, { familyId: { $in: familyIds } });
  await del('memories', Memory, { familyId: { $in: familyIds } });
  await del('albums', Album, { family: { $in: familyIds } });
  await del('notifications', Notification, { familyId: { $in: familyIds } });
  await del('locations', Location, { familyId: { $in: familyIds } });
  await del('location history', LocationHistory, { familyId: { $in: familyIds } });
  await del('comments', Comment, { family: { $in: familyIds } });
  await del('stories', Story, { familyId: { $in: familyIds } });
  await del('sent reminders', SentReminder, { familyId: { $in: familyIds } });
  await del('membership records', FamilyMember, { user: { $in: seededIds } });

  if (familyA) {
    await Family.updateOne({ _id: familyA._id }, { $pullAll: { members: seededIds } });
    // Back to the tree record the app created for Arjun.
    await FamilyMember.updateOne(
      { family: familyA._id, user: arjun._id },
      { $set: { relationshipType: 'other', relatedTo: null }, $unset: { nickname: 1 } },
    );
  }
  if (familyB) {
    await FamilyMember.deleteMany({ family: familyB._id });
    await Family.deleteOne({ _id: familyB._id });
    removed['families'] = 1;
  }
  removed['users'] = (await User.deleteMany({ _id: { $in: seededIds } })).deletedCount;

  Object.entries(removed).forEach(([k, n]) => console.log(`  - ${k}: ${n}`));
  console.log(`\nKept: Arjun (${ADMIN_EMAIL})${familyA ? ` and ${FAMILY_A}` : ''}. Run "npm run demo:seed" to rebuild the demo data.`);
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  const mode = process.argv.includes('--reset') ? 'reset' : process.argv.includes('--verify') ? 'verify' : 'seed';
  const { uri, problems, host } = checkSafety();
  if (problems.length) {
    console.error('\nREFUSED - the demo script did not run:');
    problems.forEach((p) => console.error(`  - ${p}`));
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`Connected to ${host} / ${mongoose.connection.db.databaseName} (NODE_ENV=${process.env.NODE_ENV}) - mode: ${mode}`);
  try {
    if (mode === 'reset') {
      await reset();
    } else {
      if (mode === 'seed') await seed();
      const ok = await verify();
      process.exitCode = ok ? 0 : 1;
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(async (err) => {
  console.error(`\nERROR: ${err.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
