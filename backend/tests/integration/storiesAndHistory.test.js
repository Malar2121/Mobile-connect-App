const { app, request, createFamilyWithAdmin, joinFamily } = require('../helpers/factories');

const bearer = (user) => ({ Authorization: `Bearer ${user.token}` });
const tomorrow = () => new Date(Date.now() + 86400000).toISOString();

async function makeGuest(family, user) {
  const res = await request(app)
    .put(`/api/family/members/${user.id}/role`)
    .set(bearer(family.admin))
    .send({ role: 'guest' });
  expect(res.status).toBe(200);
}

async function createEvent(owner, title) {
  const res = await request(app).post('/api/events/create').set(bearer(owner)).send({ title, date: tomorrow() });
  return (res.body.data?.event ?? res.body.data)._id;
}

/**
 * Proposal Objective 4: "a memory archive for storing photos, videos, and
 * stories"; §6.3: "a central space for storing and viewing … event notes".
 */
describe('Family stories', () => {
  let family;
  let author;
  let other;

  const share = (user, body) => request(app).post('/api/stories').set(bearer(user)).send(body);

  beforeEach(async () => {
    family = await createFamilyWithAdmin('Story Family');
    author = await joinFamily(family.inviteCode, { fullName: 'Story Teller' });
    other = await joinFamily(family.inviteCode, { fullName: 'Listener' });
  });

  it('lets a member share a story the whole family can read', async () => {
    const created = await share(author, { title: 'How Grandpa met Grandma', body: 'It rained at the Kandy perahera…', category: 'origin' });
    expect(created.status).toBe(201);
    expect(created.body.data.author.fullName).toBe('Story Teller');

    const list = await request(app).get('/api/stories').set(bearer(other));
    expect(list.status).toBe(200);
    expect(list.body.data.map((s) => s.title)).toContain('How Grandpa met Grandma');

    const one = await request(app).get(`/api/stories/${created.body.data._id}`).set(bearer(family.admin));
    expect(one.status).toBe(200);
    expect(one.body.data.category).toBe('origin');
  });

  it('keeps Sinhala and Tamil text exactly as written', async () => {
    const created = await share(author, { title: 'අපේ ගම', body: 'எங்கள் ஊர் திருவிழா' });
    const one = await request(app).get(`/api/stories/${created.body.data._id}`).set(bearer(other));
    expect(one.body.data.title).toBe('අපේ ගම');
    expect(one.body.data.body).toBe('எங்கள் ஊர் திருவிழா');
  });

  it('validates title, body and category', async () => {
    expect((await share(author, { body: 'No title' })).status).toBe(400);
    expect((await share(author, { title: 'No body' })).status).toBe(400);
    expect((await share(author, { title: 'x'.repeat(121), body: 'Too long a title' })).status).toBe(400);
    expect((await share(author, { title: 'Long', body: 'y'.repeat(5001) })).status).toBe(400);
    expect((await share(author, { title: 'Odd', body: 'Category', category: 'gossip' })).status).toBe(400);
  });

  it('lets only the author or an admin edit or delete a story', async () => {
    const id = (await share(author, { title: 'Draft', body: 'First version' })).body.data._id;

    const byOther = await request(app).put(`/api/stories/${id}`).set(bearer(other)).send({ title: 'Hijacked' });
    expect(byOther.status).toBe(403);

    const byAuthor = await request(app).put(`/api/stories/${id}`).set(bearer(author)).send({ body: 'Second version' });
    expect(byAuthor.status).toBe(200);
    expect(byAuthor.body.data.body).toBe('Second version');

    const byAdmin = await request(app).put(`/api/stories/${id}`).set(bearer(family.admin)).send({ title: 'Edited by admin' });
    expect(byAdmin.status).toBe(200);

    expect((await request(app).delete(`/api/stories/${id}`).set(bearer(other))).status).toBe(403);
    expect((await request(app).delete(`/api/stories/${id}`).set(bearer(author))).status).toBe(200);
    expect((await request(app).get(`/api/stories/${id}`).set(bearer(author))).status).toBe(404);
  });

  it('keeps guests read-only and minors out until a guardian approves', async () => {
    await share(author, { title: 'Visible', body: 'For the family' });

    const guest = await joinFamily(family.inviteCode, { fullName: 'Guest Reader' });
    await makeGuest(family, guest);
    expect((await request(app).get('/api/stories').set(bearer(guest))).status).toBe(200);
    const guestWrite = await share(guest, { title: 'Nope', body: 'Guests cannot write' });
    expect(guestWrite.status).toBe(403);
    expect(guestWrite.body.code).toBe('GUEST_READ_ONLY');

    const child = await joinFamily(family.inviteCode, { fullName: 'Waiting Child', memberType: 'child' });
    const childRead = await request(app).get('/api/stories').set(bearer(child));
    expect(childRead.status).toBe(403);
    expect(childRead.body.code).toBe('CONSENT_PENDING');
  });

  it('never shows or changes another family’s story', async () => {
    const id = (await share(author, { title: 'Private to us', body: 'Family only' })).body.data._id;
    const outsider = await createFamilyWithAdmin('Other Family');

    expect((await request(app).get(`/api/stories/${id}`).set(bearer(outsider.admin))).status).toBe(404);
    expect((await request(app).put(`/api/stories/${id}`).set(bearer(outsider.admin)).send({ title: 'x' })).status).toBe(404);
    expect((await request(app).delete(`/api/stories/${id}`).set(bearer(outsider.admin))).status).toBe(404);

    const list = await request(app).get('/api/stories').set(bearer(outsider.admin));
    expect(list.body.data).toHaveLength(0);
  });

  it('only links a story to an event in the same family', async () => {
    const ownEvent = await createEvent(family.admin, 'Our reunion');
    const linked = await share(author, { title: 'Reunion day', body: 'Everyone came', event: ownEvent });
    expect(linked.status).toBe(201);
    expect(linked.body.data.event.title).toBe('Our reunion');

    const outsider = await createFamilyWithAdmin('Event Owners');
    const foreignEvent = await createEvent(outsider.admin, 'Their party');
    const refused = await share(author, { title: 'Borrowed', body: 'Not ours', event: foreignEvent });
    expect(refused.status).toBe(404);
  });

  it('rejects a malformed story id', async () => {
    expect((await request(app).get('/api/stories/not-an-id').set(bearer(author))).status).toBe(400);
  });
});

describe('Event notes in the memory archive', () => {
  it('lists recent notes from the family’s own events only', async () => {
    const familyA = await createFamilyWithAdmin('Family A');
    const familyB = await createFamilyWithAdmin('Family B');
    const eventA = await createEvent(familyA.admin, 'A picnic');
    const eventB = await createEvent(familyB.admin, 'B wedding');

    await request(app).post(`/api/events/${eventA}/comments`).set(bearer(familyA.admin)).send({ content: 'Bring mats' });
    await request(app).post(`/api/events/${eventB}/comments`).set(bearer(familyB.admin)).send({ content: 'Dress code' });

    const res = await request(app).get('/api/events/notes').set(bearer(familyA.admin));
    expect(res.status).toBe(200);
    expect(res.body.data.map((n) => n.content)).toEqual(['Bring mats']);
    expect(res.body.data[0].event.title).toBe('A picnic');
    expect(res.body.data[0].author.fullName).toBeTruthy();
  });

  it('keeps the notes feed behind the consent gate', async () => {
    const family = await createFamilyWithAdmin('Consent Notes');
    const child = await joinFamily(family.inviteCode, { fullName: 'Pending Child', memberType: 'child' });
    const res = await request(app).get('/api/events/notes').set(bearer(child));
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CONSENT_PENDING');
  });
});

describe('Shared family history journal', () => {
  it('is shared by every member rather than stored on one device', async () => {
    const family = await createFamilyWithAdmin('History Family');
    const member = await joinFamily(family.inviteCode, { fullName: 'Family Historian' });

    const empty = await request(app).get('/api/family/history').set(bearer(member));
    expect(empty.status).toBe(200);
    expect(empty.body.data.origins).toBe('');

    const saved = await request(app)
      .put('/api/family/history')
      .set(bearer(member))
      .send({ origins: 'From Jaffna, 1920s', traditions: 'Thai Pongal at home' });
    expect(saved.status).toBe(200);
    expect(saved.body.data.updatedBy.fullName).toBe('Family Historian');

    const seenByAdmin = await request(app).get('/api/family/history').set(bearer(family.admin));
    expect(seenByAdmin.body.data.origins).toBe('From Jaffna, 1920s');
    expect(seenByAdmin.body.data.traditions).toBe('Thai Pongal at home');

    const outsider = await createFamilyWithAdmin('Other History');
    const theirs = await request(app).get('/api/family/history').set(bearer(outsider.admin));
    expect(theirs.body.data.origins).toBe('');
  });

  it('refuses guests, oversized text and empty updates', async () => {
    const family = await createFamilyWithAdmin('Guarded History');
    const guest = await joinFamily(family.inviteCode, { fullName: 'Guest Viewer' });
    await makeGuest(family, guest);

    const guestWrite = await request(app).put('/api/family/history').set(bearer(guest)).send({ origins: 'Nope' });
    expect(guestWrite.status).toBe(403);
    expect(guestWrite.body.code).toBe('GUEST_READ_ONLY');

    const tooLong = await request(app)
      .put('/api/family/history')
      .set(bearer(family.admin))
      .send({ achievements: 'z'.repeat(5001) });
    expect(tooLong.status).toBe(400);

    const nothing = await request(app).put('/api/family/history').set(bearer(family.admin)).send({});
    expect(nothing.status).toBe(400);
  });
});
