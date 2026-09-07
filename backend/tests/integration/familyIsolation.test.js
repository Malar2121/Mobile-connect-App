const { app, request, registerUser, createFamilyWithAdmin, joinFamily } = require('../helpers/factories');

/**
 * The proposal's core privacy promise (§6.3): "all data remains visible only to
 * the family group". These tests are the adversarial version of that claim —
 * family B tries to reach family A's data by guessing ids.
 */
describe('Family data isolation (proposal §6.3)', () => {
  let A;
  let B;
  let aMemory;
  let aEvent;
  let aMessage;
  let aCelebration;

  beforeEach(async () => {
    A = await createFamilyWithAdmin('Family A');
    B = await createFamilyWithAdmin('Family B');

    const post = (path, body) =>
      request(app).post(path).set('Authorization', `Bearer ${A.admin.token}`).send(body);

    // POST /api/events/create returns the event directly as `data`.
    aEvent = (await post('/api/events/create', {
      title: 'Family A private event',
      date: new Date(Date.now() + 86400000).toISOString(),
    })).body?.data ?? {};
    expect(aEvent._id).toBeTruthy();

    aMessage = (await post('/api/chat/send', { text: 'Family A private message' })).body?.data ?? {};

    aCelebration = (await post('/api/celebrations', {
      type: 'anniversary',
      title: 'Family A anniversary',
      date: new Date(Date.UTC(2010, 5, 1)).toISOString(),
    })).body?.data ?? {};
  });

  it("does not leak family A's events to family B", async () => {
    const res = await request(app).get('/api/events').set('Authorization', `Bearer ${B.admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("does not leak family A's chat to family B", async () => {
    const res = await request(app).get('/api/chat/messages').set('Authorization', `Bearer ${B.admin.token}`);
    expect(res.body.data).toHaveLength(0);
  });

  it("does not leak family A's celebrations to family B", async () => {
    const res = await request(app).get('/api/celebrations').set('Authorization', `Bearer ${B.admin.token}`);
    const titles = (res.body.data ?? []).map((c) => c.title);
    expect(titles).not.toContain('Family A anniversary');
  });

  it("blocks reading family A's event by its id", async () => {
    const res = await request(app)
      .get(`/api/events/${aEvent._id}`)
      .set('Authorization', `Bearer ${B.admin.token}`);
    expect(res.status).toBe(404);
  });

  it("blocks reading family A's celebration by its id", async () => {
    const res = await request(app)
      .get(`/api/celebrations/${aCelebration._id}`)
      .set('Authorization', `Bearer ${B.admin.token}`);
    expect(res.status).toBe(404);
  });

  it("blocks deleting family A's event", async () => {
    await request(app)
      .delete(`/api/events/${aEvent._id}`)
      .set('Authorization', `Bearer ${B.admin.token}`);

    // The event must still be there for family A.
    const check = await request(app)
      .get(`/api/events/${aEvent._id}`)
      .set('Authorization', `Bearer ${A.admin.token}`);
    expect(check.status).toBe(200);
  });

  it("blocks deleting family A's message", async () => {
    const res = await request(app)
      .delete(`/api/chat/${aMessage._id}`)
      .set('Authorization', `Bearer ${B.admin.token}`);
    expect(res.status).toBe(404);
  });

  it("blocks editing family A's message", async () => {
    const res = await request(app)
      .patch(`/api/chat/${aMessage._id}`)
      .set('Authorization', `Bearer ${B.admin.token}`)
      .send({ text: 'tampered' });
    expect(res.status).toBe(404);
  });

  it("blocks pinning family A's message", async () => {
    const res = await request(app)
      .post(`/api/chat/${aMessage._id}/pin`)
      .set('Authorization', `Bearer ${B.admin.token}`);
    expect(res.status).toBe(404);
  });

  it("blocks changing a role in another family (IDOR)", async () => {
    const victim = await joinFamily(A.inviteCode, { fullName: 'A Member' });

    const res = await request(app)
      .put(`/api/family/members/${victim.id}/role`)
      .set('Authorization', `Bearer ${B.admin.token}`)
      .send({ role: 'guest' });
    expect(res.status).toBe(404);

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${victim.token}`);
    expect(me.body.data.user.role).toBe('member');
  });

  it('blocks a user with no family from every family endpoint', async () => {
    const loner = await registerUser({ fullName: 'No Family' });
    for (const path of ['/api/memories', '/api/family-tree', '/api/celebrations', '/api/albums']) {
      const res = await request(app).get(path).set('Authorization', `Bearer ${loner.token}`);
      expect(res.status).toBe(403);
    }
  });

  it('rejects a malformed object id with 400 rather than a server error', async () => {
    const res = await request(app)
      .get('/api/events/not-an-object-id')
      .set('Authorization', `Bearer ${B.admin.token}`);
    expect(res.status).toBe(400);
  });

  it('cannot aim a join request at a family whose id was guessed', async () => {
    const outsider = await registerUser({ fullName: 'Guesser' });
    const res = await request(app)
      .post('/api/family/join-requests')
      .set('Authorization', `Bearer ${outsider.token}`)
      .send({ familyId: A.familyId });
    expect(res.status).toBe(400);
  });
});
