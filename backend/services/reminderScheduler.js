const cron = require('node-cron');
const Event = require('../models/Event');
const Celebration = require('../models/Celebration');
const SentReminder = require('../models/SentReminder');
const User = require('../models/User');
const { notifyFamilyMembers } = require('./notificationService');
const { startOfUTCDay, nextOccurrence, birthdaysFromMembers, daysUntil } = require('../utils/celebrations');
const logger = require('../utils/logger');

/**
 * Automatic reminders for events, celebrations and birthdays.
 *
 * The sweep runs hourly and asks a single question of every upcoming occasion:
 * "is today exactly N days before it, for one of its configured offsets?" If
 * so it claims the reminder by inserting a SentReminder row, and only notifies
 * when that insert succeeds. The unique index on that model is the lock, so
 * restarts and overlapping runs cannot double-send.
 *
 * Event.reminders is stored in MINUTES before the event (the existing schema);
 * celebrations use whole days. Both are normalised to days here, because a
 * daily-granularity sweep is what a family calendar actually needs.
 */

const CRON_EXPRESSION = process.env.REMINDER_CRON || '0 * * * *'; // hourly, on the hour
let task = null;

/** Claim a reminder. Returns true only if this call won the race. */
async function claim({ familyId, sourceType, sourceId, occurrenceDate, daysBefore }) {
  try {
    await SentReminder.create({
      familyId,
      sourceType,
      sourceId: String(sourceId),
      occurrenceDate: startOfUTCDay(occurrenceDate),
      daysBefore,
    });
    return true;
  } catch (err) {
    if (err.code === 11000) return false; // already sent — expected, not an error
    throw err;
  }
}

function formatWhen(days) {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

/** Reminder offsets in days for an event, from its minutes-based schedule. */
function eventOffsetsInDays(event) {
  const minutes = Array.isArray(event.reminders) && event.reminders.length ? event.reminders : [1440];
  return [...new Set(minutes.map((m) => Math.max(0, Math.round(m / 1440))))];
}

async function sweepEvents(now, results) {
  // Only events still ahead of us can have a reminder due.
  const events = await Event.find({ date: { $gte: startOfUTCDay(now) } }).select(
    'title date familyId reminders location',
  );

  for (const event of events) {
    const until = daysUntil(event.date, now);
    if (until === null || until < 0) continue;

    for (const offset of eventOffsetsInDays(event)) {
      if (offset !== until) continue;
      const won = await claim({
        familyId: event.familyId,
        sourceType: 'event',
        sourceId: event._id,
        occurrenceDate: event.date,
        daysBefore: offset,
      });
      if (!won) continue;

      await notifyFamilyMembers({
        familyId: event.familyId,
        type: 'event_reminder',
        params: { title: event.title, days: until, location: event.location },
        title: `${event.title} is ${formatWhen(until)}`,
        body: event.location ? `At ${event.location}` : 'Tap to see the details.',
        data: { eventId: String(event._id), kind: 'event_reminder' },
      });
      results.sent.push({ type: 'event', title: event.title, daysBefore: offset });
    }
  }
}

async function sweepCelebrations(now, results) {
  const celebrations = await Celebration.find({}).select(
    'title type date recurrence familyId reminderDaysBefore',
  );

  for (const celebration of celebrations) {
    const occurrence = nextOccurrence(celebration, now);
    if (!occurrence) continue;
    const until = daysUntil(occurrence, now);

    for (const offset of celebration.reminderDaysBefore ?? []) {
      if (offset !== until) continue;
      const won = await claim({
        familyId: celebration.familyId,
        sourceType: 'celebration',
        sourceId: celebration._id,
        occurrenceDate: occurrence,
        daysBefore: offset,
      });
      if (!won) continue;

      await notifyFamilyMembers({
        familyId: celebration.familyId,
        type: 'celebration_reminder',
        params: { title: celebration.title, days: until, celebrationType: celebration.type },
        title: `${celebration.title} is ${formatWhen(until)}`,
        body: celebration.type === 'anniversary' ? 'An anniversary is coming up.' : 'A family celebration is coming up.',
        data: { celebrationId: String(celebration._id), kind: 'celebration_reminder' },
      });
      results.sent.push({ type: 'celebration', title: celebration.title, daysBefore: offset });
    }
  }
}

async function sweepBirthdays(now, results) {
  // Birthdays are virtual (derived from User.dateOfBirth), so they are swept
  // per family from the member profiles rather than from a collection.
  const members = await User.find({ familyId: { $ne: null }, dateOfBirth: { $ne: null } }).select(
    'fullName dateOfBirth familyId avatar',
  );

  const byFamily = new Map();
  members.forEach((m) => {
    const key = String(m.familyId);
    if (!byFamily.has(key)) byFamily.set(key, []);
    byFamily.get(key).push(m);
  });

  for (const [familyId, familyMembers] of byFamily) {
    for (const birthday of birthdaysFromMembers(familyMembers, now)) {
      for (const offset of birthday.reminderDaysBefore) {
        if (offset !== birthday.daysUntil) continue;
        const won = await claim({
          familyId,
          sourceType: 'birthday',
          sourceId: birthday._id,
          occurrenceDate: birthday.nextOccurrence,
          daysBefore: offset,
        });
        if (!won) continue;

        const who = birthday.relatedMembers[0];
        await notifyFamilyMembers({
          familyId,
          excludeUserId: who?._id, // don't remind someone about their own birthday
          type: 'birthday_reminder',
          params: { name: who?.fullName ?? '', days: birthday.daysUntil, age: birthday.turningAge },
          title: `${birthday.title} is ${formatWhen(birthday.daysUntil)}`,
          body: birthday.turningAge ? `Turning ${birthday.turningAge}.` : 'Don\'t forget to wish them well.',
          data: { userId: String(who?._id ?? ''), kind: 'birthday_reminder' },
        });
        results.sent.push({ type: 'birthday', title: birthday.title, daysBefore: offset });
      }
    }
  }
}

/**
 * Run one sweep. Exported so it can be invoked directly by tests and by an
 * operator, not only by the cron trigger.
 */
async function runReminderSweep(now = new Date()) {
  const results = { ranAt: now.toISOString(), sent: [], errors: [] };

  for (const [name, sweep] of [
    ['events', sweepEvents],
    ['celebrations', sweepCelebrations],
    ['birthdays', sweepBirthdays],
  ]) {
    try {
      await sweep(now, results);
    } catch (err) {
      // One failing category must not stop the others.
      results.errors.push(`${name}: ${err.message}`);
      logger.error(`Reminder sweep (${name}) failed: ${err.message}`);
    }
  }

  if (results.sent.length > 0 || results.errors.length > 0) {
    logger.info(`Reminder sweep: ${results.sent.length} sent, ${results.errors.length} error(s)`);
  }
  return results;
}

function startReminderScheduler() {
  if (task) return task;
  if (process.env.DISABLE_REMINDER_SCHEDULER === 'true') {
    logger.warn('Reminder scheduler disabled via DISABLE_REMINDER_SCHEDULER');
    return null;
  }
  if (!cron.validate(CRON_EXPRESSION)) {
    logger.error(`Invalid REMINDER_CRON "${CRON_EXPRESSION}" — reminder scheduler not started`);
    return null;
  }

  task = cron.schedule(CRON_EXPRESSION, () => {
    runReminderSweep().catch((err) => logger.error(`Reminder sweep failed: ${err.message}`));
  });

  logger.info(`Reminder scheduler started (${CRON_EXPRESSION})`);
  return task;
}

function stopReminderScheduler() {
  if (task) {
    task.stop();
    task = null;
  }
}

module.exports = { startReminderScheduler, stopReminderScheduler, runReminderSweep };
