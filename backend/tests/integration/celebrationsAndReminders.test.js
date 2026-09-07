const { app, request, createFamilyWithAdmin, joinFamily } = require('../helpers/factories');
const { runReminderSweep } = require('../../services/reminderScheduler');
const SentReminder = require('../../models/SentReminder');

const dateInDays = (days, year) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return new Date(Date.UTC(year ?? d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

describe('Celebration calendar (proposal Objective 3)', () => {
  let family;

  beforeEach(async () => {
    family = await createFamilyWithAdmin('Celebration Family');
  });

  const post = (body) =>
    request(app).post('/api/celebrations').set('Authorization', `Bearer ${family.admin.token}`).send(body);

  it('creates an anniversary with its next occurrence computed', async () => {
    const res = await post({
      type: 'anniversary',
      title: 'Wedding Anniversary',
      date: dateInDays(1, 2010).toISOString(),
    });
    expect(res.status).toBe(201);
    expect(res.body.data.daysUntil).toBe(1);
    expect(res.body.data.yearsRunning).toBeGreaterThan(0);
  });

  it('creates a cultural celebration', async () => {
    const res = await post({ type: 'cultural', title: 'Thai Pongal', date: dateInDays(5).toISOString() });
    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('cultural');
  });

  it('derives birthdays from member profiles rather than storing them', async () => {
    await joinFamily(family.inviteCode, {
      fullName: 'Birthday Person',
      dateOfBirth: dateInDays(2, 1995).toISOString(),
    });

    const res = await request(app).get('/api/celebrations').set('Authorization', `Bearer ${family.admin.token}`);
    const bday = res.body.data.find((c) => c.type === 'birthday');
    expect(bday).toBeTruthy();
    expect(bday.virtual).toBe(true);
    expect(bday.daysUntil).toBe(2);
    expect(bday.turningAge).toBe(31);
  });

  it('refuses a manually created birthday, since birthdays come from profiles', async () => {
    const res = await post({ type: 'birthday', title: 'Fake', date: new Date().toISOString() });
    expect(res.status).toBe(400);
  });

  it('refuses a duplicate celebration', async () => {
    const body = { type: 'anniversary', title: 'Same', date: dateInDays(3, 2011).toISOString() };
    await post(body);
    const res = await post(body);
    expect(res.status).toBe(409);
  });

  it('refuses an invalid date', async () => {
    const res = await post({ type: 'cultural', title: 'Bad date', date: 'not-a-date' });
    expect(res.status).toBe(400);
  });

  it('refuses a related member from another family', async () => {
    const other = await createFamilyWithAdmin('Outside Family');
    const res = await post({
      type: 'cultural',
      title: 'Cross family',
      date: dateInDays(4).toISOString(),
      relatedMembers: [other.admin.id],
    });
    expect(res.status).toBe(400);
  });

  it('lets only the creator or an admin delete a celebration', async () => {
    const created = await post({ type: 'cultural', title: 'Deletable', date: dateInDays(6).toISOString() });
    const member = await joinFamily(family.inviteCode, { fullName: 'Other Member' });

    const denied = await request(app)
      .delete(`/api/celebrations/${created.body.data._id}`)
      .set('Authorization', `Bearer ${member.token}`);
    expect(denied.status).toBe(403);

    const allowed = await request(app)
      .delete(`/api/celebrations/${created.body.data._id}`)
      .set('Authorization', `Bearer ${family.admin.token}`);
    expect(allowed.status).toBe(200);
  });
});

describe('Automatic reminders (proposal Objective 3)', () => {
  let family;

  beforeEach(async () => {
    family = await createFamilyWithAdmin('Reminder Family');
    await joinFamily(family.inviteCode, { fullName: 'Reminder Member' });
  });

  it('sends a celebration reminder at its configured offset', async () => {
    await request(app)
      .post('/api/celebrations')
      .set('Authorization', `Bearer ${family.admin.token}`)
      .send({
        type: 'anniversary',
        title: 'Reminder Anniversary',
        date: dateInDays(1, 2010).toISOString(),
        reminderDaysBefore: [1],
      });

    const result = await runReminderSweep();
    expect(result.errors).toHaveLength(0);
    expect(result.sent.filter((s) => s.title === 'Reminder Anniversary')).toHaveLength(1);
  });

  it('does not send a reminder before its offset is reached', async () => {
    await request(app)
      .post('/api/celebrations')
      .set('Authorization', `Bearer ${family.admin.token}`)
      .send({
        type: 'cultural',
        title: 'Far Off',
        date: dateInDays(20).toISOString(),
        reminderDaysBefore: [1],
      });

    const result = await runReminderSweep();
    expect(result.sent.filter((s) => s.title === 'Far Off')).toHaveLength(0);
  });

  it('never sends the same reminder twice, even across repeated sweeps', async () => {
    await request(app)
      .post('/api/celebrations')
      .set('Authorization', `Bearer ${family.admin.token}`)
      .send({
        type: 'anniversary',
        title: 'Once Only',
        date: dateInDays(1, 2012).toISOString(),
        reminderDaysBefore: [1],
      });

    const first = await runReminderSweep();
    const second = await runReminderSweep();
    const third = await runReminderSweep();

    expect(first.sent.filter((s) => s.title === 'Once Only')).toHaveLength(1);
    expect(second.sent.filter((s) => s.title === 'Once Only')).toHaveLength(0);
    expect(third.sent.filter((s) => s.title === 'Once Only')).toHaveLength(0);

    const rows = await SentReminder.countDocuments({ sourceType: 'celebration' });
    expect(rows).toBe(1);
  });

  it('sends an event reminder derived from Event.reminders (minutes)', async () => {
    await request(app)
      .post('/api/events/create')
      .set('Authorization', `Bearer ${family.admin.token}`)
      .send({
        title: 'Reminder Event',
        date: dateInDays(1).toISOString(),
        reminders: [1440], // 24h before
      });

    const result = await runReminderSweep();
    expect(result.sent.filter((s) => s.type === 'event' && s.title === 'Reminder Event')).toHaveLength(1);
  });

  it('sends a birthday reminder on the day its offset is reached', async () => {
    await joinFamily(family.inviteCode, {
      fullName: 'Tomorrow Birthday',
      dateOfBirth: dateInDays(1, 1990).toISOString(),
    });

    const result = await runReminderSweep();
    expect(result.sent.filter((s) => s.type === 'birthday')).toHaveLength(1);
  });

  it('delivers the reminder as a notification family members can read', async () => {
    const member = await joinFamily(family.inviteCode, { fullName: 'Notified Member' });
    await request(app)
      .post('/api/celebrations')
      .set('Authorization', `Bearer ${family.admin.token}`)
      .send({
        type: 'cultural',
        title: 'Notified Festival',
        date: dateInDays(2).toISOString(),
        reminderDaysBefore: [2],
      });

    await runReminderSweep();

    const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${member.token}`);
    const notes = res.body.data?.notifications ?? res.body.data ?? [];
    expect(notes.some((n) => n.type === 'celebration_reminder')).toBe(true);
  });
});
