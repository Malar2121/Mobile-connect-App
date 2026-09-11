// Stand-in for Cloudinary storage, as in memoryApproval.test.js: files stay in
// memory and get the `path` multer-storage-cloudinary would set, so sharing is
// tested without uploading to a real account. The 10 MB limit is the real one.
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

const { app, request, createFamilyWithAdmin, joinFamily } = require('../helpers/factories');

const bearer = (user) => ({ Authorization: `Bearer ${user.token}` });

function sendFile(user, { bytes = Buffer.from('file-bytes'), filename, contentType, text }) {
  const req = request(app).post('/api/chat/send').set(bearer(user));
  if (text) req.field('text', text);
  return req.attach('media', bytes, { filename, contentType });
}

async function history(user) {
  const res = await request(app).get('/api/chat/messages').set(bearer(user));
  expect(res.status).toBe(200);
  return res.body.data;
}

/**
 * Proposal §6.3: the chat module includes file sharing. Photos, videos, voice
 * notes and documents go through the same endpoint the app uses.
 */
describe('Chat file sharing over the API', () => {
  let family;
  let member;

  beforeEach(async () => {
    family = await createFamilyWithAdmin('Sharing Family');
    member = await joinFamily(family.inviteCode, { fullName: 'Sharing Member' });
  });

  it('shares a photo with a caption, and the family receives it', async () => {
    const res = await sendFile(family.admin, { filename: 'picnic.jpg', contentType: 'image/jpeg', text: 'At the lake' });
    expect(res.status).toBe(201);
    expect(res.body.data.mediaType).toBe('image');
    expect(res.body.data.mediaUrl).toMatch(/^https:\/\//);
    expect(res.body.data.text).toBe('At the lake');

    const received = (await history(member)).find((m) => String(m._id) === String(res.body.data._id));
    expect(received.mediaUrl).toBe(res.body.data.mediaUrl);
  });

  it('keeps the document name and types video and voice notes by their format', async () => {
    const pdf = await sendFile(member, { filename: 'Train times.pdf', contentType: 'application/pdf' });
    expect(pdf.status).toBe(201);
    expect(pdf.body.data.mediaType).toBe('document');
    expect(pdf.body.data.documentName).toBe('Train times.pdf');

    const video = await sendFile(member, { filename: 'clip.mp4', contentType: 'video/mp4' });
    expect(video.status).toBe(201);
    expect(video.body.data.mediaType).toBe('video');

    const voice = await sendFile(member, { filename: 'note.m4a', contentType: 'audio/m4a' });
    expect(voice.status).toBe(201);
    expect(voice.body.data.mediaType).toBe('audio');
  });

  it('refuses an empty message, and a file over the size limit with a clear code', async () => {
    const empty = await request(app).post('/api/chat/send').set(bearer(member)).send({});
    expect(empty.status).toBe(400);

    const tooBig = await sendFile(member, {
      bytes: Buffer.alloc(10 * 1024 * 1024 + 1),
      filename: 'long-video.mp4',
      contentType: 'video/mp4',
    });
    expect(tooBig.status).toBe(413);
    expect(tooBig.body.code).toBe('FILE_TOO_LARGE');
    expect(await history(member)).toHaveLength(0);
  });

  it('refuses a file from a guest before anything is uploaded', async () => {
    const guest = await joinFamily(family.inviteCode, { fullName: 'Visiting Guest' });
    const role = await request(app).put(`/api/family/members/${guest.id}/role`).set(bearer(family.admin)).send({ role: 'guest' });
    expect(role.status).toBe(200);

    const res = await sendFile(guest, { filename: 'picnic.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('GUEST_READ_ONLY');
  });

  it('never shows a shared file to another family', async () => {
    const sent = await sendFile(family.admin, { filename: 'private.jpg', contentType: 'image/jpeg' });
    expect(sent.status).toBe(201);

    const outsider = await createFamilyWithAdmin('Other Family');
    const theirs = await history(outsider.admin);
    expect(theirs.map((m) => String(m._id))).not.toContain(String(sent.body.data._id));
  });
});
