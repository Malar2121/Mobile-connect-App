const { app, request, createFamilyWithAdmin, joinFamily } = require('../helpers/factories');

/**
 * Legacy profiles and tributes are family content. They must follow the same
 * rules as memories: guests read but never write (proposal §6.2), minors wait
 * for a guardian (§8), and nothing crosses between families (§6.3).
 */
describe('Legacy profiles follow the family content rules', () => {
  let family;
  let member;
  let profileId;

  const asUser = (token) => ({ Authorization: `Bearer ${token}` });

  beforeEach(async () => {
    family = await createFamilyWithAdmin('Legacy Family');
    member = await joinFamily(family.inviteCode, { fullName: 'Remembered Member' });

    const created = await request(app)
      .post('/api/legacy')
      .set(asUser(family.admin.token))
      .send({ memberId: member.id, biography: 'A life well lived.' });
    expect(created.status).toBe(201);
    profileId = created.body.data.profile._id;
  });

  it('lets a family member read profiles and leave a tribute', async () => {
    const list = await request(app).get('/api/legacy').set(asUser(member.token));
    expect(list.status).toBe(200);

    const tribute = await request(app)
      .post(`/api/legacy/${profileId}/tributes`)
      .set(asUser(member.token))
      .send({ content: 'We miss you.' });
    expect(tribute.status).toBe(201);
  });

  it('keeps a guest read-only: reading works, tributes are refused', async () => {
    const guest = await joinFamily(family.inviteCode, { fullName: 'Visiting Cousin' });
    await request(app)
      .put(`/api/family/members/${guest.id}/role`)
      .set(asUser(family.admin.token))
      .send({ role: 'guest' });

    const read = await request(app).get(`/api/legacy/${profileId}`).set(asUser(guest.token));
    expect(read.status).toBe(200);

    const write = await request(app)
      .post(`/api/legacy/${profileId}/tributes`)
      .set(asUser(guest.token))
      .send({ content: 'Should not be stored' });
    expect(write.status).toBe(403);
    expect(write.body.code).toBe('GUEST_READ_ONLY');
  });

  it('blocks an unapproved minor from reading or writing legacy profiles', async () => {
    const child = await joinFamily(family.inviteCode, { fullName: 'Young Child', memberType: 'child' });

    for (const res of [
      await request(app).get('/api/legacy').set(asUser(child.token)),
      await request(app).get(`/api/legacy/${profileId}`).set(asUser(child.token)),
      await request(app)
        .post(`/api/legacy/${profileId}/tributes`)
        .set(asUser(child.token))
        .send({ content: 'Not yet allowed' }),
    ]) {
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('CONSENT_PENDING');
    }
  });

  it('does not reveal or accept tributes for another family’s profile', async () => {
    const other = await createFamilyWithAdmin('Other Family');

    const read = await request(app).get(`/api/legacy/${profileId}`).set(asUser(other.admin.token));
    expect(read.status).toBe(404);

    const write = await request(app)
      .post(`/api/legacy/${profileId}/tributes`)
      .set(asUser(other.admin.token))
      .send({ content: 'Cross-family write' });
    expect(write.status).toBe(404);
  });

  it('only lets an admin create a legacy profile', async () => {
    const another = await joinFamily(family.inviteCode, { fullName: 'Another Member' });
    const res = await request(app)
      .post('/api/legacy')
      .set(asUser(member.token))
      .send({ memberId: another.id, biography: 'Not an admin' });
    expect(res.status).toBe(403);
  });
});
