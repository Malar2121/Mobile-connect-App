/**
 * Seed a full demo family with data for every mobile feature.
 *
 * Usage:
 *   node scripts/seedDemoData.js          # create / top-up demo data
 *   node scripts/seedDemoData.js --reset  # wipe demo feature data and reseed
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Family = require('../models/Family');
const FamilyMember = require('../models/FamilyMember');
const Event = require('../models/Event');
const EventPoll = require('../models/EventPoll');
const Memory = require('../models/Memory');
const Album = require('../models/Album');
const Message = require('../models/Message');
const Location = require('../models/Location');
const Notification = require('../models/Notification');
const { resolveMongoUri } = require('../config/db');

const DEMO_PASSWORD = 'Family1234';
const FAMILY_NAME = 'Connect Family';
const INVITE_CODE = 'CONN-ECT1';

const DEMO_USERS = [
  { email: 'malar@gmail.com', fullName: 'Malaravan', role: 'admin', elderMode: false },
  { email: 'seelan@gmail.com', fullName: 'Seelan', role: 'parent', elderMode: false },
  { email: 'priya@gmail.com', fullName: 'Priya', role: 'parent', elderMode: false },
  { email: 'arjun@gmail.com', fullName: 'Arjun', role: 'child', elderMode: false },
  { email: 'meena@gmail.com', fullName: 'Meena', role: 'member', elderMode: true },
];

const AVATAR = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=128`;

const MEMORY_IMAGES = [
  { seed: 'family-pongal', caption: 'Pongal celebration at home', album: 'Festivals' },
  { seed: 'family-beach', caption: 'Marina Beach evening walk', album: 'Trips' },
  { seed: 'family-dinner', caption: 'Sunday family dinner', album: 'Everyday' },
  { seed: 'family-temple', caption: 'Temple visit with grandparents', album: 'Festivals' },
  { seed: 'family-birthday', caption: 'Arjun birthday cake cutting', album: 'Birthdays' },
  { seed: 'family-park', caption: 'Evening park time', album: 'Everyday' },
  { seed: 'family-cooking', caption: 'Priya teaching Arjun to cook', album: 'Everyday' },
  { seed: 'family-garden', caption: 'Home garden harvest', album: 'Everyday' },
];

// Chennai area — spread members slightly for the map
const LOCATIONS = [
  { email: 'malar@gmail.com', lat: 13.0827, lng: 80.2707 },
  { email: 'seelan@gmail.com', lat: 13.0569, lng: 80.2428 },
  { email: 'priya@gmail.com', lat: 13.0604, lng: 80.2496 },
  { email: 'arjun@gmail.com', lat: 13.0478, lng: 80.2092 },
  { email: 'meena@gmail.com', lat: 13.0878, lng: 80.2785 },
];

const CHAT_SCRIPT = [
  { from: 'seelan@gmail.com', text: 'Vanakkam family! Good morning.' },
  { from: 'priya@gmail.com', text: 'Morning! Coffee ready ah?' },
  { from: 'malar@gmail.com', text: 'Yes, coming in 5 minutes.' },
  { from: 'arjun@gmail.com', text: 'Appa, school bus late today.' },
  { from: 'seelan@gmail.com', text: 'Okay, wait at the gate.' },
  { from: 'meena@gmail.com', text: 'This Sunday temple trip confirm ah?' },
  { from: 'priya@gmail.com', text: 'Yes, 7 AM start. Breakfast pack pannuren.' },
  { from: 'malar@gmail.com', text: 'I will pick up flowers on the way.' },
  { from: 'seelan@gmail.com', text: 'Super! See you all Sunday.' },
  { from: 'arjun@gmail.com', text: 'Can we stop for ice cream after?' },
  { from: 'priya@gmail.com', text: 'Homework finish pannitu vaanga first.' },
  { from: 'malar@gmail.com', text: 'Dinner plan enga tonight?' },
  { from: 'seelan@gmail.com', text: 'Hotel Saravana Bhavan — 7:30 PM.' },
  { from: 'meena@gmail.com', text: 'I will join. Count me in.' },
  { from: 'priya@gmail.com', text: 'Photos eduthu group-la share pannuren.' },
  { from: 'arjun@gmail.com', text: 'Hiiii' },
  { from: 'malar@gmail.com', text: 'Welcome home Arjun!' },
  { from: 'seelan@gmail.com', text: 'Drive safe everyone.' },
];

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

async function upsertUsers() {
  const map = {};
  for (const spec of DEMO_USERS) {
    let user = await User.findOne({ email: spec.email }).select('+password');
    if (user) {
      user.fullName = spec.fullName;
      user.password = DEMO_PASSWORD;
      user.role = spec.role;
      user.elderMode = spec.elderMode;
      user.avatar = AVATAR(spec.fullName);
      user.isActive = true;
      user.lastSeen = new Date();
      await user.save();
    } else {
      user = await User.create({
        fullName: spec.fullName,
        email: spec.email,
        password: DEMO_PASSWORD,
        role: spec.role,
        elderMode: spec.elderMode,
        avatar: AVATAR(spec.fullName),
      });
    }
    map[spec.email] = user;
  }
  return map;
}

async function upsertFamily(users) {
  const admin = users['malar@gmail.com'];
  const memberIds = DEMO_USERS.map((u) => users[u.email]._id);

  let family = await Family.findOne({ inviteCode: INVITE_CODE });
  if (!family) {
    family = await Family.findOne({ name: FAMILY_NAME });
  }

  if (family) {
    family.name = FAMILY_NAME;
    family.createdBy = admin._id;
    family.members = memberIds;
    family.inviteCode = INVITE_CODE;
    await family.save();
  } else {
    family = await Family.create({
      name: FAMILY_NAME,
      createdBy: admin._id,
      members: memberIds,
      inviteCode: INVITE_CODE,
    });
  }

  for (const spec of DEMO_USERS) {
    await User.findByIdAndUpdate(users[spec.email]._id, {
      familyId: family._id,
      role: spec.role,
    });
  }

  return family;
}

async function clearFeatureData(familyId) {
  await Promise.all([
    Event.deleteMany({ familyId }),
    EventPoll.deleteMany({ family: familyId }),
    Memory.deleteMany({ familyId }),
    Album.deleteMany({ family: familyId }),
    Message.deleteMany({ familyId }),
    Location.deleteMany({ familyId }),
    Notification.deleteMany({ familyId }),
    FamilyMember.deleteMany({ family: familyId }),
  ]);
}

async function seedFamilyMembers(family, users) {
  const specs = [
    { email: 'malar@gmail.com', nickname: 'Malar', relationshipType: 'parent', relatedTo: 'seelan@gmail.com', joinedVia: 'creator' },
    { email: 'seelan@gmail.com', nickname: 'Appa', relationshipType: 'parent', relatedTo: null, joinedVia: 'creator' },
    { email: 'priya@gmail.com', nickname: 'Amma', relationshipType: 'spouse', relatedTo: 'seelan@gmail.com', joinedVia: 'invite_code' },
    { email: 'arjun@gmail.com', nickname: 'Arjun', relationshipType: 'child', relatedTo: 'seelan@gmail.com', joinedVia: 'invite_code' },
    { email: 'meena@gmail.com', nickname: 'Meena', relationshipType: 'sibling', relatedTo: 'malar@gmail.com', joinedVia: 'invite_code' },
  ];

  for (const spec of specs) {
    const user = users[spec.email];
    const relatedTo = spec.relatedTo ? users[spec.relatedTo]._id : null;
    await FamilyMember.findOneAndUpdate(
      { family: family._id, user: user._id },
      {
        family: family._id,
        user: user._id,
        role: user.role,
        nickname: spec.nickname,
        relationshipType: spec.relationshipType,
        relatedTo,
        joinedVia: spec.joinedVia,
        isActive: true,
      },
      { upsert: true, new: true },
    );
  }
}

async function seedEvents(family, users) {
  const admin = users['malar@gmail.com'];
  const memberIds = DEMO_USERS.map((u) => users[u.email]._id);

  const guest = (email, status) => ({
    userId: users[email]._id,
    status,
  });

  const allGuests = (statuses) =>
    DEMO_USERS.map((u, i) => guest(u.email, statuses[i] ?? 'pending'));

  const events = await Event.insertMany([
    {
      title: 'Sunday Family Dinner',
      description: 'Dinner at Saravana Bhavan. Everyone welcome!',
      familyId: family._id,
      createdBy: admin._id,
      date: daysFromNow(3),
      startTime: '19:30',
      endTime: '21:30',
      location: 'Hotel Saravana Bhavan, T Nagar',
      image: 'https://picsum.photos/seed/family-dinner-event/800/400',
      guests: allGuests(['accepted', 'accepted', 'accepted', 'maybe', 'accepted']),
    },
    {
      title: "Arjun's Birthday Party",
      description: 'Cake, games, and family photos.',
      familyId: family._id,
      createdBy: users['priya@gmail.com']._id,
      date: daysFromNow(12),
      startTime: '17:00',
      endTime: '20:00',
      location: 'Home — Connect Family',
      image: 'https://picsum.photos/seed/family-birthday-event/800/400',
      guests: allGuests(['accepted', 'accepted', 'accepted', 'accepted', 'pending']),
    },
    {
      title: 'Summer Beach Trip',
      description: 'Marina Beach — morning walk and breakfast.',
      familyId: family._id,
      createdBy: users['seelan@gmail.com']._id,
      date: daysFromNow(-14),
      startTime: '06:00',
      endTime: '10:00',
      location: 'Marina Beach, Chennai',
      image: 'https://picsum.photos/seed/family-beach-event/800/400',
      guests: allGuests(['accepted', 'accepted', 'accepted', 'accepted', 'declined']),
    },
    {
      title: 'Temple Visit',
      description: 'Monthly family temple visit.',
      familyId: family._id,
      createdBy: admin._id,
      date: daysFromNow(7),
      startTime: '07:00',
      endTime: '11:00',
      location: 'Kapaleeshwarar Temple, Mylapore',
      guests: allGuests(['accepted', 'pending', 'accepted', 'accepted', 'accepted']),
    },
  ]);

  return events;
}

async function seedPoll(family, users, event) {
  const opt1 = { dateTime: daysFromNow(12), label: 'Saturday 5 PM', votes: [] };
  const opt2 = { dateTime: daysFromNow(13), label: 'Sunday 11 AM', votes: [] };

  const poll = await EventPoll.create({
    event: event._id,
    family: family._id,
    createdBy: users['priya@gmail.com']._id,
    question: 'Best time for birthday party?',
    options: [opt1, opt2],
    deadline: daysFromNow(5),
    isClosed: false,
  });

  return poll;
}

async function seedMemories(family, users) {
  const memories = [];
  for (let i = 0; i < MEMORY_IMAGES.length; i++) {
    const item = MEMORY_IMAGES[i];
    const uploader = users[DEMO_USERS[i % DEMO_USERS.length].email];
    const tagged = [users['arjun@gmail.com']._id, users['priya@gmail.com']._id].filter(
      (id) => String(id) !== String(uploader._id),
    );

    memories.push({
      familyId: family._id,
      uploadedBy: uploader._id,
      mediaUrl: `https://picsum.photos/seed/${item.seed}/800/600`,
      mediaType: 'image',
      caption: item.caption,
      album: item.album,
      tags: tagged,
      likes: i % 2 === 0 ? [users['seelan@gmail.com']._id, users['malar@gmail.com']._id] : [],
    });
  }

  return Memory.insertMany(memories);
}

async function seedAlbums(family, users, memories, event) {
  const tripMemories = memories.filter((m) => m.album === 'Trips');
  const festivalMemories = memories.filter((m) => m.album === 'Festivals');

  await Album.insertMany([
    {
      family: family._id,
      createdBy: users['malar@gmail.com']._id,
      title: 'Family Trips',
      description: 'Beach days and outings',
      coverMemory: tripMemories[0]?._id ?? memories[0]._id,
      mediaCount: tripMemories.length,
      event: null,
    },
    {
      family: family._id,
      createdBy: users['priya@gmail.com']._id,
      title: 'Festivals',
      description: 'Pongal, Diwali, and temple visits',
      coverMemory: festivalMemories[0]?._id ?? memories[1]._id,
      mediaCount: festivalMemories.length,
      event: event._id,
      isShared: true,
      shareLink: 'demo-festivals-share',
    },
  ]);
}

async function seedMessages(family, users) {
  const allIds = DEMO_USERS.map((u) => users[u.email]._id);
  const docs = CHAT_SCRIPT.map((line, index) => {
    const sender = users[line.from];
    const readers = allIds.filter((id) => String(id) !== String(sender._id));
    return {
      familyId: family._id,
      sender: sender._id,
      text: line.text,
      readBy: index < CHAT_SCRIPT.length - 2 ? allIds : readers,
      createdAt: minutesAgo((CHAT_SCRIPT.length - index) * 18),
      updatedAt: minutesAgo((CHAT_SCRIPT.length - index) * 18),
    };
  });

  return Message.insertMany(docs);
}

async function seedLocations(family, users) {
  const docs = LOCATIONS.map((loc) => ({
    userId: users[loc.email]._id,
    familyId: family._id,
    latitude: loc.lat,
    longitude: loc.lng,
    updatedAt: hoursAgo(LOCATIONS.indexOf(loc) * 0.5),
  }));

  return Location.insertMany(docs);
}

async function seedNotifications(family, users, events, memories) {
  const specs = [
    {
      recipient: 'seelan@gmail.com',
      type: 'event_created',
      title: 'New family event',
      body: 'Sunday Family Dinner added to the calendar.',
      data: { eventId: String(events[0]._id) },
      isRead: true,
    },
    {
      recipient: 'arjun@gmail.com',
      type: 'event_created',
      title: 'Birthday party planned!',
      body: "Arjun's Birthday Party is on the calendar.",
      data: { eventId: String(events[1]._id) },
      isRead: false,
    },
    {
      recipient: 'malar@gmail.com',
      type: 'memory_uploaded',
      title: 'New memory shared',
      body: 'Priya uploaded a photo to the gallery.',
      data: { memoryId: String(memories[2]._id) },
      isRead: false,
    },
    {
      recipient: 'priya@gmail.com',
      type: 'memory_uploaded',
      title: 'New memory shared',
      body: 'Seelan uploaded Marina Beach evening walk.',
      data: { memoryId: String(memories[1]._id) },
      isRead: true,
    },
    {
      recipient: 'meena@gmail.com',
      type: 'chat_message',
      title: 'New message from Seelan',
      body: 'Drive safe everyone.',
      data: {},
      isRead: false,
    },
    {
      recipient: 'seelan@gmail.com',
      type: 'chat_message',
      title: 'New message from Arjun',
      body: 'Hiiii',
      data: {},
      isRead: true,
    },
    {
      recipient: 'arjun@gmail.com',
      type: 'event_created',
      title: 'Temple visit this Sunday',
      body: 'Family temple visit confirmed for Sunday morning.',
      data: { eventId: String(events[3]._id) },
      isRead: false,
    },
    {
      recipient: 'malar@gmail.com',
      type: 'memory_uploaded',
      title: 'Someone liked your photo',
      body: 'Seelan liked your Pongal celebration photo.',
      data: { memoryId: String(memories[0]._id) },
      isRead: true,
    },
    {
      recipient: 'priya@gmail.com',
      type: 'chat_message',
      title: 'New message from Meena',
      body: 'This Sunday temple trip confirm ah?',
      data: {},
      isRead: false,
    },
    {
      recipient: 'seelan@gmail.com',
      type: 'event_created',
      title: 'RSVP reminder',
      body: 'Meena has not responded to Sunday Family Dinner yet.',
      data: { eventId: String(events[0]._id) },
      isRead: false,
    },
  ];

  const docs = specs.map((n) => ({
    recipient: users[n.recipient]._id,
    familyId: family._id,
    type: n.type,
    title: n.title,
    body: n.body,
    data: n.data,
    isRead: n.isRead,
    createdAt: hoursAgo(Math.floor(Math.random() * 48) + 1),
  }));

  return Notification.insertMany(docs);
}

async function main() {
  const reset = process.argv.includes('--reset');
  const uri = resolveMongoUri();
  await mongoose.connect(uri);

  console.log('Seeding demo data...\n');

  const users = await upsertUsers();
  const family = await upsertFamily(users);
  console.log(`Family: ${family.name} (${family.inviteCode})`);

  const existingMessages = await Message.countDocuments({ familyId: family._id });
  if (existingMessages > 0 && !reset) {
    console.log('\nDemo data already exists. Use --reset to wipe and reseed.');
    printLoginHelp();
    await mongoose.disconnect();
    return;
  }

  if (reset || existingMessages === 0) {
    if (reset) {
      console.log('Clearing existing demo feature data...');
      await clearFeatureData(family._id);
    }

    await seedFamilyMembers(family, users);
    const events = await seedEvents(family, users);
    await seedPoll(family, users, events[1]);
    const memories = await seedMemories(family, users);
    await seedAlbums(family, users, memories, events[3]);
    await seedMessages(family, users);
    await seedLocations(family, users);
    await seedNotifications(family, users, events, memories);

    console.log('\nSeeded:');
    console.log(`  Users:         ${DEMO_USERS.length}`);
    console.log(`  Events:        ${events.length}`);
    console.log(`  Memories:      ${memories.length}`);
    console.log(`  Messages:      ${CHAT_SCRIPT.length}`);
    console.log(`  Locations:     ${LOCATIONS.length}`);
    console.log(`  Notifications: 10`);
    console.log(`  Albums:        2`);
    console.log(`  Family tree:   ${DEMO_USERS.length} members`);
  }

  printLoginHelp();
  await mongoose.disconnect();
}

function printLoginHelp() {
  console.log('\n--- Demo logins (password for all: Family1234) ---');
  for (const u of DEMO_USERS) {
    console.log(`  ${u.email.padEnd(22)} ${u.fullName} (${u.role})`);
  }
  console.log(`\nInvite code: ${INVITE_CODE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
