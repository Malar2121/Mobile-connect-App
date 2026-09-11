const { io: connectClient } = require('socket.io-client');
const Message = require('../../models/Message');
const { app, request, createFamilyWithAdmin, joinFamily } = require('../helpers/factories');
const { server } = require('../../server');

/**
 * The Socket.IO transport must enforce exactly what the REST API enforces:
 * guests are read-only, unapproved minors see nothing, and messages never
 * leave the family room (proposal §6.2, §6.3, §8).
 */
describe('Socket.IO authorization', () => {
  let baseUrl;
  const open = [];

  beforeAll((done) => {
    server.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      done();
    });
  });

  afterEach(() => {
    while (open.length) open.pop().close();
  });

  afterAll(() => {
    server.close();
  });

  function connect(token) {
    return new Promise((resolve, reject) => {
      const socket = connectClient(baseUrl, {
        auth: { token },
        transports: ['websocket'],
        forceNew: true,
        reconnection: false,
      });
      open.push(socket);
      socket.once('family_access', (access) => resolve({ socket, access }));
      socket.once('connect_error', reject);
    });
  }

  const emitWithAck = (socket, event, payload) =>
    new Promise((resolve) => socket.emit(event, payload, resolve));

  /** Resolves with the next payload of `event`, or null if none arrives in time. */
  const nextEvent = (socket, event, ms = 1500) =>
    new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), ms);
      socket.once(event, (payload) => {
        clearTimeout(timer);
        resolve(payload);
      });
    });

  const makeGuest = async (family, user) => {
    const res = await request(app)
      .put(`/api/family/members/${user.id}/role`)
      .set('Authorization', `Bearer ${family.admin.token}`)
      .send({ role: 'guest' });
    expect(res.status).toBe(200);
  };

  it('delivers a member’s message to the rest of the family in real time', async () => {
    const family = await createFamilyWithAdmin('Live Family');
    const member = await joinFamily(family.inviteCode, { fullName: 'Chatty Member' });
    const admin = await connect(family.admin.token);
    const sender = await connect(member.token);
    expect(sender.access).toEqual({ canRead: true, canWrite: true, code: null });

    const received = nextEvent(admin.socket, 'new_message');
    const ack = await emitWithAck(sender.socket, 'send_message', { text: 'Hello family' });

    expect(ack.success).toBe(true);
    expect((await received).text).toBe('Hello family');
  });

  it('refuses a guest message over the socket, exactly as the REST API does', async () => {
    const family = await createFamilyWithAdmin('Guest Socket Family');
    const guest = await joinFamily(family.inviteCode, { fullName: 'Visiting Guest' });
    await makeGuest(family, guest);

    const { socket, access } = await connect(guest.token);
    expect(access).toEqual({ canRead: true, canWrite: false, code: 'GUEST_READ_ONLY' });

    const ack = await emitWithAck(socket, 'send_message', { text: 'Sneaky write' });
    expect(ack.code).toBe('GUEST_READ_ONLY');
    expect(await Message.countDocuments({ familyId: family.familyId })).toBe(0);
  });

  it('applies a role change made after the socket connected', async () => {
    const family = await createFamilyWithAdmin('Demoted Family');
    const member = await joinFamily(family.inviteCode, { fullName: 'Soon Guest' });
    const { socket } = await connect(member.token);

    await makeGuest(family, member);

    const ack = await emitWithAck(socket, 'send_message', { text: 'After demotion' });
    expect(ack.code).toBe('GUEST_READ_ONLY');
    expect(await Message.countDocuments({ familyId: family.familyId })).toBe(0);
  });

  it('does not relay typing indicators from a guest', async () => {
    const family = await createFamilyWithAdmin('Typing Family');
    const guest = await joinFamily(family.inviteCode, { fullName: 'Quiet Guest' });
    await makeGuest(family, guest);

    const admin = await connect(family.admin.token);
    const guestSocket = await connect(guest.token);

    const typing = nextEvent(admin.socket, 'typing', 600);
    guestSocket.socket.emit('typing');
    expect(await typing).toBeNull();
  });

  it('keeps an unapproved minor out of the family room', async () => {
    const family = await createFamilyWithAdmin('Minor Family');
    const child = await joinFamily(family.inviteCode, { fullName: 'Waiting Child', memberType: 'child' });

    const { socket, access } = await connect(child.token);
    expect(access).toEqual({ canRead: false, canWrite: false, code: 'CONSENT_PENDING' });

    const leaked = nextEvent(socket, 'new_message', 800);
    await request(app)
      .post('/api/chat/send')
      .set('Authorization', `Bearer ${family.admin.token}`)
      .send({ text: 'Adults only for now' });
    expect(await leaked).toBeNull();

    const ack = await emitWithAck(socket, 'send_message', { text: 'Let me in' });
    expect(ack.code).toBe('CONSENT_PENDING');
  });

  it('admits the minor to live chat as soon as a guardian approves', async () => {
    const family = await createFamilyWithAdmin('Approval Family');
    const child = await joinFamily(family.inviteCode, { fullName: 'Approved Child', memberType: 'child' });
    const { socket } = await connect(child.token);

    const pending = await request(app)
      .get('/api/consent/pending')
      .set('Authorization', `Bearer ${family.admin.token}`);
    const accessUpdate = nextEvent(socket, 'family_access');
    await request(app)
      .post(`/api/consent/${pending.body.data[0]._id}/approve`)
      .set('Authorization', `Bearer ${family.admin.token}`);

    expect(await accessUpdate).toEqual({ canRead: true, canWrite: true, code: null });

    const received = nextEvent(socket, 'new_message');
    await request(app)
      .post('/api/chat/send')
      .set('Authorization', `Bearer ${family.admin.token}`)
      .send({ text: 'Welcome in' });
    expect((await received)?.text).toBe('Welcome in');
  });

  it('never delivers one family’s messages to another family', async () => {
    const familyA = await createFamilyWithAdmin('Family A');
    const familyB = await createFamilyWithAdmin('Family B');
    const sender = await connect(familyA.admin.token);
    const outsider = await connect(familyB.admin.token);

    const leaked = nextEvent(outsider.socket, 'new_message', 800);
    const ack = await emitWithAck(sender.socket, 'send_message', { text: 'Private to A' });
    expect(ack.success).toBe(true);
    expect(await leaked).toBeNull();
  });

  it('rejects a connection without a valid token', async () => {
    await expect(connect('not-a-real-token')).rejects.toThrow(/Invalid or expired token/);
  });
});
