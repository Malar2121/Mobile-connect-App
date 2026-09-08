const { app, request, createFamilyWithAdmin, joinFamily } = require('../helpers/factories');

/**
 * Event notes (proposal §6.3 — the memory archive stores and shows
 * "photos, short videos, and event notes").
 */
describe('Event notes (proposal §6.3)', () => {
  let family;
  let eventId;

  beforeEach(async () => {
    family = await createFamilyWithAdmin('Notes Family');
    const res = await request(app)
      .post('/api/events/create')
      .set('Authorization', `Bearer ${family.admin.token}`)
      .send({ title: 'Family Dinner', date: new Date(Date.now() + 86400000).toISOString() });
    eventId = res.body.data._id;
    expect(eventId).toBeTruthy();
  });

  const addNote = (token, content) =>
    request(app).post(`/api/events/${eventId}/comments`).set('Authorization', `Bearer ${token}`).send({ content });

  it('stores a note against an event', async () => {
    const res = await addNote(family.admin.token, 'Bring the cake at 6pm.');
    expect(res.status).toBe(201);
    expect(res.body.data.comment.content).toBe('Bring the cake at 6pm.');
    expect(res.body.data.comment.author.fullName).toBe('Family Admin');
  });

  it('returns notes in chronological order with their authors', async () => {
    const member = await joinFamily(family.inviteCode, { fullName: 'Note Writer' });
    await addNote(family.admin.token, 'First note');
    await addNote(member.token, 'Second note');

    const res = await request(app)
      .get(`/api/events/${eventId}/comments`)
      .set('Authorization', `Bearer ${family.admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.comments).toHaveLength(2);
    expect(res.body.data.comments[0].content).toBe('First note');
    expect(res.body.data.comments[1].author.fullName).toBe('Note Writer');
  });

  it('rejects an empty note', async () => {
    const res = await addNote(family.admin.token, '');
    expect(res.status).toBe(400);
  });

  it('persists notes across separate reads', async () => {
    await addNote(family.admin.token, 'Persisted note');
    const first = await request(app)
      .get(`/api/events/${eventId}/comments`)
      .set('Authorization', `Bearer ${family.admin.token}`);
    const second = await request(app)
      .get(`/api/events/${eventId}/comments`)
      .set('Authorization', `Bearer ${family.admin.token}`);
    expect(first.body.data.comments).toHaveLength(1);
    expect(second.body.data.comments).toHaveLength(1);
  });

  it("never exposes notes to another family", async () => {
    await addNote(family.admin.token, 'Private family note');
    const other = await createFamilyWithAdmin('Outside Family');

    const res = await request(app)
      .get(`/api/events/${eventId}/comments`)
      .set('Authorization', `Bearer ${other.admin.token}`);
    expect(res.status).toBe(404);
  });

  it("never lets another family add a note", async () => {
    const other = await createFamilyWithAdmin('Outside Family');
    const res = await addNote(other.admin.token, 'Intruding note');
    expect(res.status).toBe(404);
  });

  it('refuses a note from a guest (read-only role)', async () => {
    const guest = await joinFamily(family.inviteCode, { fullName: 'Guest Relative' });
    await request(app)
      .put(`/api/family/members/${guest.id}/role`)
      .set('Authorization', `Bearer ${family.admin.token}`)
      .send({ role: 'guest' });

    const res = await addNote(guest.token, 'Guest note');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('GUEST_READ_ONLY');
  });

  it('lets a guest read notes', async () => {
    await addNote(family.admin.token, 'Readable note');
    const guest = await joinFamily(family.inviteCode, { fullName: 'Guest Reader' });
    await request(app)
      .put(`/api/family/members/${guest.id}/role`)
      .set('Authorization', `Bearer ${family.admin.token}`)
      .send({ role: 'guest' });

    const res = await request(app)
      .get(`/api/events/${eventId}/comments`)
      .set('Authorization', `Bearer ${guest.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.comments).toHaveLength(1);
  });
});
