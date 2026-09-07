const { app, request, createFamilyWithAdmin, joinFamily } = require('../helpers/factories');

describe('Guest role (proposal §6.2 — admin, member and guest)', () => {
  let family;
  let guest;

  beforeEach(async () => {
    family = await createFamilyWithAdmin('Guest Family');
    guest = await joinFamily(family.inviteCode, { fullName: 'Extended Relative' });

    await request(app)
      .put(`/api/family/members/${guest.id}/role`)
      .set('Authorization', `Bearer ${family.admin.token}`)
      .send({ role: 'guest' });
  });

  it('lets an admin assign the guest role', async () => {
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${guest.token}`);
    expect(me.body.data.user.role).toBe('guest');
  });

  it('lets a guest read shared family content', async () => {
    for (const path of ['/api/events', '/api/memories', '/api/chat/messages', '/api/celebrations']) {
      const res = await request(app).get(path).set('Authorization', `Bearer ${guest.token}`);
      expect(res.status).toBe(200);
    }
  });

  it('refuses every write from a guest', async () => {
    const attempts = [
      request(app).post('/api/chat/send').set('Authorization', `Bearer ${guest.token}`).send({ text: 'nope' }),
      request(app)
        .post('/api/events/create')
        .set('Authorization', `Bearer ${guest.token}`)
        .send({ title: 'nope', date: new Date(Date.now() + 86400000).toISOString() }),
      request(app)
        .post('/api/celebrations')
        .set('Authorization', `Bearer ${guest.token}`)
        .send({ type: 'cultural', title: 'nope', date: new Date().toISOString() }),
    ];

    for (const res of await Promise.all(attempts)) {
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('GUEST_READ_ONLY');
    }
  });

  it('keeps SOS available to a guest in danger', async () => {
    const res = await request(app)
      .post('/api/location/sos')
      .set('Authorization', `Bearer ${guest.token}`)
      .send({ latitude: 6.9271, longitude: 79.8612 });
    expect(res.body.code).not.toBe('GUEST_READ_ONLY');
  });

  it('leaves ordinary members able to write', async () => {
    const member = await joinFamily(family.inviteCode, { fullName: 'Normal Member' });
    const res = await request(app)
      .post('/api/chat/send')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ text: 'members can post' });
    expect(res.status).toBe(201);
  });

  it('rejects an unknown role value', async () => {
    const res = await request(app)
      .put(`/api/family/members/${guest.id}/role`)
      .set('Authorization', `Bearer ${family.admin.token}`)
      .send({ role: 'superuser' });
    expect(res.status).toBe(400);
  });

  it('refuses a change that would leave the family with no admin', async () => {
    const res = await request(app)
      .put(`/api/family/members/${family.admin.id}/role`)
      .set('Authorization', `Bearer ${family.admin.token}`)
      .send({ role: 'member' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/without an admin/i);
  });

  it('allows an admin to step down once another admin exists', async () => {
    const second = await joinFamily(family.inviteCode, { fullName: 'Second Admin' });
    await request(app)
      .put(`/api/family/members/${second.id}/role`)
      .set('Authorization', `Bearer ${family.admin.token}`)
      .send({ role: 'admin' });

    const res = await request(app)
      .put(`/api/family/members/${family.admin.id}/role`)
      .set('Authorization', `Bearer ${family.admin.token}`)
      .send({ role: 'member' });
    expect(res.status).toBe(200);
  });
});
