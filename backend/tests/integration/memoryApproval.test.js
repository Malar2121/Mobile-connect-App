// Stand-in for Cloudinary storage: the file stays in memory and gets the same
// `path` and `size` fields multer-storage-cloudinary provides, so the approval
// rules are tested without uploading anything to a real account.
jest.mock('../../config/cloudinary', () => {
  const multer = require('multer');
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
  const single = (field) => (req, res, next) =>
    upload.single(field)(req, res, (err) => {
      if (req.file) req.file.path = `https://res.cloudinary.test/${Date.now()}-${req.file.originalname}`;
      next(err);
    });
  const engine = { single };
  return { cloudinary: {}, avatarUpload: engine, memoryUpload: engine, chatUpload: engine };
});

const Notification = require('../../models/Notification');
const { app, request, createFamilyWithAdmin, joinFamily } = require('../helpers/factories');

const bearer = (user) => ({ Authorization: `Bearer ${user.token}` });
const FILE_BYTES = Buffer.from('not-really-an-image');

function upload(user, caption = 'Family picnic') {
  return request(app)
    .post('/api/memories/upload')
    .set(bearer(user))
    .field('caption', caption)
    .attach('media', FILE_BYTES, { filename: 'photo.jpg', contentType: 'image/jpeg' });
}

async function uploadId(user, caption) {
  const res = await upload(user, caption);
  expect(res.status).toBe(201);
  return String(res.body.data._id);
}

async function listIds(user) {
  const res = await request(app).get('/api/memories').set(bearer(user));
  expect(res.status).toBe(200);
  return res.body.data.map((m) => String(m._id));
}

async function waitFor(check, timeoutMs = 2000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await check()) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return false;
}

const review = (user, id, decision, body = {}) =>
  request(app).post(`/api/memories/${id}/${decision}`).set(bearer(user)).send(body);

describe('Memory approval (proposal §8 — members approve shared photos and videos)', () => {
  let family;
  let member;
  let other;

  beforeEach(async () => {
    family = await createFamilyWithAdmin('Approval Family');
    member = await joinFamily(family.inviteCode, { fullName: 'Uploading Member' });
    other = await joinFamily(family.inviteCode, { fullName: 'Other Member' });
  });

  it('holds a new upload for review instead of publishing it', async () => {
    const res = await upload(member, 'Beach day');
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');

    const id = String(res.body.data._id);
    expect(await listIds(member)).toContain(id);
    expect(await listIds(other)).not.toContain(id);
    expect(await listIds(family.admin)).not.toContain(id);
  });

  it('puts the upload in the review queue of other adult members only', async () => {
    const id = await uploadId(member);

    const adminQueue = await request(app).get('/api/memories/pending').set(bearer(family.admin));
    expect(adminQueue.status).toBe(200);
    expect(adminQueue.body.data.map((m) => String(m._id))).toContain(id);

    const ownQueue = await request(app).get('/api/memories/pending').set(bearer(member));
    expect(ownQueue.body.data.map((m) => String(m._id))).not.toContain(id);

    // A reviewer can open the pending memory in order to decide on it.
    const details = await request(app).get(`/api/memories/${id}`).set(bearer(other));
    expect(details.status).toBe(200);
  });

  it('publishes the memory once another member approves it', async () => {
    const id = await uploadId(member);

    const res = await review(family.admin, id, 'approve');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('approved');
    expect(await listIds(other)).toContain(id);

    const notified = await waitFor(() => Notification.exists({ recipient: member.id, type: 'memory_approved' }));
    expect(notified).toBe(true);
  });

  it('never lets an uploader approve their own memory', async () => {
    const id = await uploadId(member);
    const res = await review(member, id, 'approve');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('SELF_REVIEW');
  });

  it('keeps a rejected memory from the family while its uploader still sees it', async () => {
    const id = await uploadId(member);

    const res = await review(family.admin, id, 'reject', { reason: 'Please ask Grandma first' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('rejected');
    expect(res.body.data.review.reason).toBe('Please ask Grandma first');

    expect(await listIds(other)).not.toContain(id);
    expect(await listIds(member)).toContain(id);
    expect((await request(app).get(`/api/memories/${id}`).set(bearer(other))).status).toBe(404);
    expect((await request(app).post('/api/memories/like').set(bearer(other)).send({ memoryId: id })).status).toBe(404);
    expect(
      (await request(app).post(`/api/memories/${id}/comments`).set(bearer(other)).send({ content: 'Hi' })).status,
    ).toBe(404);
  });

  it('accepts only the first decision', async () => {
    const id = await uploadId(member);
    expect((await review(family.admin, id, 'approve')).status).toBe(200);

    const second = await review(other, id, 'reject');
    expect(second.status).toBe(409);
    expect(second.body.code).toBe('ALREADY_REVIEWED');
  });

  it('does not let guests or child accounts review', async () => {
    const id = await uploadId(member);

    const guest = await joinFamily(family.inviteCode, { fullName: 'Guest Relative' });
    await request(app).put(`/api/family/members/${guest.id}/role`).set(bearer(family.admin)).send({ role: 'guest' });

    const guestQueue = await request(app).get('/api/memories/pending').set(bearer(guest));
    expect(guestQueue.status).toBe(403);
    expect(guestQueue.body.code).toBe('MEMORY_REVIEW_FORBIDDEN');
    expect((await request(app).get(`/api/memories/${id}`).set(bearer(guest))).status).toBe(404);

    const guestDecision = await review(guest, id, 'approve');
    expect(guestDecision.status).toBe(403);
    expect(guestDecision.body.code).toBe('GUEST_READ_ONLY');

    const child = await joinFamily(family.inviteCode, { fullName: 'Young Reviewer', memberType: 'child' });
    const unapproved = await review(child, id, 'approve');
    expect(unapproved.status).toBe(403);
    expect(unapproved.body.code).toBe('CONSENT_PENDING');

    const pending = await request(app).get('/api/consent/pending').set(bearer(family.admin));
    await request(app).post(`/api/consent/${pending.body.data[0]._id}/approve`).set(bearer(family.admin));

    const approvedChild = await review(child, id, 'approve');
    expect(approvedChild.status).toBe(403);
    expect(approvedChild.body.code).toBe('MEMORY_REVIEW_FORBIDDEN');

    const still = await request(app).get(`/api/memories/${id}`).set(bearer(family.admin));
    expect(still.body.data.status).toBe('pending');
  });

  it('keeps the memory invisible to another family', async () => {
    const id = await uploadId(member);
    const outsider = await createFamilyWithAdmin('Outside Family');

    expect((await request(app).get(`/api/memories/${id}`).set(bearer(outsider.admin))).status).toBe(404);
    expect((await review(outsider.admin, id, 'approve')).status).toBe(404);

    const queue = await request(app).get('/api/memories/pending').set(bearer(outsider.admin));
    expect(queue.body.data.map((m) => String(m._id))).not.toContain(id);
  });

  it('publishes straight away when nobody else could review it', async () => {
    const solo = await createFamilyWithAdmin('Solo Family');
    const res = await upload(solo.admin);
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('approved');
    expect(res.body.data.review.automatic).toBe(true);
  });

  it('keeps pending memories out of albums and album covers', async () => {
    const id = await uploadId(member);

    const album = await request(app).post('/api/albums').set(bearer(family.admin)).send({ title: 'Summer' });
    expect(album.status).toBe(201);
    const albumId = album.body.data.album._id;

    const add = await request(app)
      .post(`/api/albums/${albumId}/add-media`)
      .set(bearer(family.admin))
      .send({ memoryIds: [id] });
    expect(add.body.data.addedCount).toBe(0);

    const cover = await request(app).put(`/api/albums/${albumId}`).set(bearer(family.admin)).send({ coverMemoryId: id });
    expect(cover.status).toBe(404);
  });

  it('refuses to link an album to another family’s event', async () => {
    const outsider = await createFamilyWithAdmin('Event Owners');
    const created = await request(app)
      .post('/api/events/create')
      .set(bearer(outsider.admin))
      .send({ title: 'Their party', date: new Date(Date.now() + 86400000).toISOString() });
    const eventId = (created.body.data?.event ?? created.body.data)._id;

    const res = await request(app)
      .post('/api/albums')
      .set(bearer(family.admin))
      .send({ title: 'Borrowed event', eventId });
    expect(res.status).toBe(404);
  });

  it('reports family storage use and refuses uploads beyond the quota', async () => {
    await uploadId(member);

    const usage = await request(app).get('/api/memories/usage').set(bearer(family.admin));
    expect(usage.status).toBe(200);
    expect(usage.body.data.usedBytes).toBe(FILE_BYTES.length);

    const previous = process.env.FAMILY_MEDIA_QUOTA_MB;
    process.env.FAMILY_MEDIA_QUOTA_MB = '0.00001'; // about 10 bytes
    try {
      const res = await upload(other);
      expect(res.status).toBe(413);
      expect(res.body.code).toBe('MEDIA_QUOTA_EXCEEDED');
    } finally {
      if (previous === undefined) delete process.env.FAMILY_MEDIA_QUOTA_MB;
      else process.env.FAMILY_MEDIA_QUOTA_MB = previous;
    }
  });

  it('rejects a malformed memory id', async () => {
    const res = await review(family.admin, 'not-an-id', 'approve');
    expect(res.status).toBe(400);
  });
});
