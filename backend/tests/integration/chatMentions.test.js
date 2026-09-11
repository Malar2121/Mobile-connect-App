const Notification = require('../../models/Notification');
const { app, request, createFamilyWithAdmin, joinFamily } = require('../helpers/factories');

const bearer = (user) => ({ Authorization: `Bearer ${user.token}` });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Notifications are dispatched after the response, so wait for them to land.
async function waitFor(check, timeoutMs = 3000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const value = await check();
    if (value) return value;
    await sleep(50);
  }
  return null;
}

const send = (user, text) => request(app).post('/api/chat/send').set(bearer(user)).send({ text });
const mentionIds = (message) => (message.mentions ?? []).map((m) => String(m._id ?? m));
const count = (recipient, type) => Notification.countDocuments({ recipient, type });

/**
 * Proposal §6.3: real-time chat "with mentions". A mention must reach the
 * person named, once, and only people in the same family can be named.
 */
describe('Chat mentions over the API', () => {
  let family;
  let amma;
  let nimal;

  beforeEach(async () => {
    family = await createFamilyWithAdmin('Mention Family');
    amma = await joinFamily(family.inviteCode, { fullName: 'Amma Perera' });
    nimal = await joinFamily(family.inviteCode, { fullName: 'Nimal Silva' });
  });

  it('alerts the member who is named, and nobody twice', async () => {
    const res = await send(family.admin, '@Amma Perera please bring the cake');
    expect(res.status).toBe(201);
    expect(mentionIds(res.body.data)).toEqual([String(amma.id)]);

    const mention = await waitFor(() => Notification.findOne({ recipient: amma.id, type: 'chat_mention' }));
    expect(mention).not.toBeNull();
    expect(String(mention.data.messageId)).toBe(String(res.body.data._id));

    // Everyone else gets the ordinary family message notification.
    expect(await waitFor(() => Notification.findOne({ recipient: nimal.id, type: 'chat_message' }))).not.toBeNull();
    await sleep(200);

    expect(await count(amma.id, 'chat_message')).toBe(0);
    expect(await count(family.admin.id, 'chat_mention')).toBe(0);
    expect(await count(family.admin.id, 'chat_message')).toBe(0);
  });

  it('does not turn a name from another family into a mention', async () => {
    const other = await createFamilyWithAdmin('Neighbour Family');
    const kamal = await joinFamily(other.inviteCode, { fullName: 'Kamal Fernando' });

    const res = await send(family.admin, '@Kamal Fernando are you coming?');
    expect(res.status).toBe(201);
    expect(mentionIds(res.body.data)).toEqual([]);

    expect(await waitFor(() => Notification.findOne({ recipient: nimal.id, type: 'chat_message' }))).not.toBeNull();
    await sleep(200);
    expect(await count(kamal.id, 'chat_mention')).toBe(0);
    expect(await count(kamal.id, 'chat_message')).toBe(0);
  });

  it('alerts only the people an edit newly mentions', async () => {
    const sent = await send(family.admin, '@Amma Perera see you soon');
    const id = sent.body.data._id;
    expect(await waitFor(() => Notification.findOne({ recipient: amma.id, type: 'chat_mention' }))).not.toBeNull();

    const edit = (text) => request(app).patch(`/api/chat/${id}`).set(bearer(family.admin)).send({ text });

    const added = await edit('@Amma Perera and @Nimal Silva see you soon');
    expect(added.status).toBe(200);
    expect(mentionIds(added.body.data).sort()).toEqual([String(amma.id), String(nimal.id)].sort());
    expect(await waitFor(() => Notification.findOne({ recipient: nimal.id, type: 'chat_mention' }))).not.toBeNull();

    // Saving the same text again notifies nobody.
    expect((await edit('@Amma Perera and @Nimal Silva see you soon!')).status).toBe(200);
    await sleep(300);
    expect(await count(amma.id, 'chat_mention')).toBe(1);
    expect(await count(nimal.id, 'chat_mention')).toBe(1);
  });

  it('only lets the sender edit a message', async () => {
    const sent = await send(family.admin, 'Lunch is at noon');
    const res = await request(app).patch(`/api/chat/${sent.body.data._id}`).set(bearer(nimal)).send({ text: '@Nimal Silva changed it' });
    expect(res.status).toBe(403);
  });
});
