const { app, request, registerUser, createFamilyWithAdmin, joinFamily } = require('../helpers/factories');

const GATED = ['/api/chat/messages', '/api/memories', '/api/events', '/api/celebrations', '/api/family-tree', '/api/albums'];

describe('Parental consent for minors (proposal §8, §6.3)', () => {
  let family;
  let child;

  beforeEach(async () => {
    family = await createFamilyWithAdmin('Consent Family');
    child = await joinFamily(family.inviteCode, { fullName: 'Minor Child', memberType: 'child' });
  });

  it('tells a joining minor that a guardian must approve them', async () => {
    expect(child.joinRes.status).toBe(200);
    expect(child.joinRes.body.data.consentRequired).toBe(true);
  });

  it('blocks an unapproved minor from every family endpoint', async () => {
    for (const path of GATED) {
      const res = await request(app).get(path).set('Authorization', `Bearer ${child.token}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('CONSENT_PENDING');
    }
  });

  it('does not gate an adult member of the same family', async () => {
    const adult = await joinFamily(family.inviteCode, { fullName: 'Adult Member' });
    const res = await request(app).get('/api/memories').set('Authorization', `Bearer ${adult.token}`);
    expect(res.status).toBe(200);
  });

  it('lets a blocked minor read their own status, so the app can explain why', async () => {
    const res = await request(app).get('/api/consent/me').set('Authorization', `Bearer ${child.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.required).toBe(true);
    expect(res.body.data.status).toBe('pending');
  });

  it('reports consent as not applicable for an adult', async () => {
    const adult = await joinFamily(family.inviteCode, { fullName: 'Adult Member' });
    const res = await request(app).get('/api/consent/me').set('Authorization', `Bearer ${adult.token}`);
    expect(res.body.data.required).toBe(false);
  });

  it('shows the pending request to a guardian', async () => {
    const res = await request(app)
      .get('/api/consent/pending')
      .set('Authorization', `Bearer ${family.admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].child.fullName).toBe('Minor Child');
  });

  it('hides the review queue from a non-guardian member', async () => {
    const member = await joinFamily(family.inviteCode, { fullName: 'Plain Member' });
    const res = await request(app)
      .get('/api/consent/pending')
      .set('Authorization', `Bearer ${member.token}`);
    expect(res.status).toBe(403);
  });

  it('opens access once a guardian approves', async () => {
    const pending = await request(app)
      .get('/api/consent/pending')
      .set('Authorization', `Bearer ${family.admin.token}`);
    const id = pending.body.data[0]._id;

    const approve = await request(app)
      .post(`/api/consent/${id}/approve`)
      .set('Authorization', `Bearer ${family.admin.token}`);
    expect(approve.status).toBe(200);
    expect(approve.body.data.status).toBe('approved');
    expect(approve.body.data.decidedBy).toBeTruthy();

    for (const path of GATED) {
      const res = await request(app).get(path).set('Authorization', `Bearer ${child.token}`);
      expect(res.status).toBe(200);
    }
  });

  it('re-closes access when a guardian rejects, with a distinct code', async () => {
    const pending = await request(app)
      .get('/api/consent/pending')
      .set('Authorization', `Bearer ${family.admin.token}`);
    const id = pending.body.data[0]._id;

    await request(app).post(`/api/consent/${id}/reject`).set('Authorization', `Bearer ${family.admin.token}`);
    const res = await request(app).get('/api/memories').set('Authorization', `Bearer ${child.token}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CONSENT_REJECTED');
  });

  it('never lets a minor approve their own account', async () => {
    const pending = await request(app)
      .get('/api/consent/pending')
      .set('Authorization', `Bearer ${family.admin.token}`);
    const id = pending.body.data[0]._id;

    const res = await request(app).post(`/api/consent/${id}/approve`).set('Authorization', `Bearer ${child.token}`);
    expect(res.status).toBe(403);
  });

  it("never lets another family's admin decide", async () => {
    const other = await createFamilyWithAdmin('Other Family');
    const pending = await request(app)
      .get('/api/consent/pending')
      .set('Authorization', `Bearer ${family.admin.token}`);
    const id = pending.body.data[0]._id;

    const res = await request(app).post(`/api/consent/${id}/approve`).set('Authorization', `Bearer ${other.admin.token}`);
    expect(res.status).toBe(404);
  });

  it('stops gating a member who is no longer a minor', async () => {
    const res = await request(app)
      .put(`/api/family/members/${child.id}/type`)
      .set('Authorization', `Bearer ${family.admin.token}`)
      .send({ memberType: 'adult' });
    expect(res.status).toBe(200);

    const after = await request(app).get('/api/memories').set('Authorization', `Bearer ${child.token}`);
    expect(after.status).toBe(200);
  });

  it('opens a consent request when an admin marks an adult as a child', async () => {
    const member = await joinFamily(family.inviteCode, { fullName: 'Becomes Minor' });
    await request(app)
      .put(`/api/family/members/${member.id}/type`)
      .set('Authorization', `Bearer ${family.admin.token}`)
      .send({ memberType: 'child' });

    const res = await request(app).get('/api/memories').set('Authorization', `Bearer ${member.token}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CONSENT_PENDING');
  });
});
