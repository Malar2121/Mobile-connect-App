const mongoose = require('mongoose');
const { app, request, createFamilyWithAdmin, joinFamily } = require('../helpers/factories');

const bearer = (user) => ({ Authorization: `Bearer ${user.token}` });
const daysFromNow = (days) => new Date(Date.now() + days * 86400000).toISOString();

async function createEvent(owner, title = 'Family lunch') {
  const res = await request(app).post('/api/events/create').set(bearer(owner)).send({ title, date: daysFromNow(10) });
  return (res.body.data?.event ?? res.body.data)._id;
}

async function createPoll(owner, eventId, extra = {}) {
  const res = await request(app)
    .post('/api/polls')
    .set(bearer(owner))
    .send({
      eventId,
      question: 'When shall we meet?',
      options: [
        { dateTime: daysFromNow(3), label: 'Saturday' },
        { dateTime: daysFromNow(4), label: 'Sunday' },
      ],
      ...extra,
    });
  expect(res.status).toBe(201);
  const { poll } = res.body.data;
  const [saturday, sunday] = poll.options.map((o) => String(o._id));
  return { id: String(poll._id), saturday, sunday };
}

const vote = (user, pollId, optionId, choice) =>
  request(app).post(`/api/polls/${pollId}/vote`).set(bearer(user)).send({ optionId, vote: choice });

const resultFor = (body, optionId) => body.data.results.find((r) => String(r.optionId) === optionId);

/**
 * Proposal Objective 2 and §6.3: members share availability, and the app
 * suggests the date that works best (Smart Date Suggestion). The algorithm has
 * its own unit tests; these exercise the API that phones actually call.
 */
describe('Availability polls over the API', () => {
  let family;
  let first;
  let second;

  beforeEach(async () => {
    family = await createFamilyWithAdmin('Poll Family');
    first = await joinFamily(family.inviteCode, { fullName: 'First Member' });
    second = await joinFamily(family.inviteCode, { fullName: 'Second Member' });
  });

  it('says nobody has voted yet instead of inventing a winner', async () => {
    const poll = await createPoll(family.admin, await createEvent(family.admin));

    const res = await request(app).get(`/api/polls/${poll.id}`).set(bearer(first));
    expect(res.status).toBe(200);
    expect(res.body.data.suggestionReason).toBe('no_responses_yet');
    expect(String(res.body.data.suggestion.optionId)).toBe(poll.saturday);
    expect(res.body.data.suggestion.confidence).toBe('none');
  });

  it('measures availability against the whole family and prefers a date nobody ruled out', async () => {
    const poll = await createPoll(family.admin, await createEvent(family.admin));

    const afterOne = await vote(family.admin, poll.id, poll.saturday, 'yes');
    expect(afterOne.status).toBe(200);
    // One yes out of three members is 33%, not 100% of those who replied.
    expect(resultFor(afterOne.body, poll.saturday).availabilityScore).toBe(33);

    await vote(first, poll.id, poll.saturday, 'no');
    await vote(first, poll.id, poll.sunday, 'yes');
    await vote(second, poll.id, poll.sunday, 'yes');
    const final = await vote(family.admin, poll.id, poll.sunday, 'yes');

    expect(resultFor(final.body, poll.saturday).blockers).toBe(1);
    expect(resultFor(final.body, poll.sunday).availabilityScore).toBe(100);
    expect(String(final.body.data.suggestion.optionId)).toBe(poll.sunday);
    expect(final.body.data.suggestionReason).toBe('works_for_everyone_who_replied');
    expect(final.body.data.suggestion.confidence).toBe('high');

    // Every member reads the same suggestion back.
    const seen = await request(app).get(`/api/polls/${poll.id}`).set(bearer(second));
    expect(String(seen.body.data.suggestion.optionId)).toBe(poll.sunday);
  });

  it('replaces a member’s earlier vote rather than counting it twice', async () => {
    const poll = await createPoll(family.admin, await createEvent(family.admin));

    await vote(first, poll.id, poll.saturday, 'yes');
    const changed = await vote(first, poll.id, poll.saturday, 'no');

    expect(resultFor(changed.body, poll.saturday).blockers).toBe(1);
    expect(resultFor(changed.body, poll.saturday).availabilityScore).toBe(0);

    const read = await request(app).get(`/api/polls/${poll.id}`).set(bearer(first));
    const saturday = read.body.data.poll.options.find((o) => String(o._id) === poll.saturday);
    expect(saturday.votes).toHaveLength(1);
  });

  it('rejects malformed polls and votes', async () => {
    const eventId = await createEvent(family.admin);

    const oneOption = await request(app)
      .post('/api/polls')
      .set(bearer(family.admin))
      .send({ eventId, question: 'Only one date?', options: [{ dateTime: daysFromNow(3) }] });
    expect(oneOption.status).toBe(422);

    const poll = await createPoll(family.admin, eventId);
    expect((await vote(first, poll.id, poll.saturday, 'perhaps')).status).toBe(422);
    expect((await vote(first, poll.id, new mongoose.Types.ObjectId().toString(), 'yes')).status).toBe(404);
  });

  it('keeps another family out of the poll and its event', async () => {
    const poll = await createPoll(family.admin, await createEvent(family.admin));
    const outsider = await createFamilyWithAdmin('Other Family');

    expect((await request(app).get(`/api/polls/${poll.id}`).set(bearer(outsider.admin))).status).toBe(404);
    expect((await vote(outsider.admin, poll.id, poll.saturday, 'yes')).status).toBe(404);

    const ownEvent = await createEvent(family.admin, 'Private event');
    const hijack = await request(app)
      .post('/api/polls')
      .set(bearer(outsider.admin))
      .send({ eventId: ownEvent, question: 'Hijack?', options: [{ dateTime: daysFromNow(3) }, { dateTime: daysFromNow(4) }] });
    expect(hijack.status).toBe(404);
  });

  it('lets only the creator or an admin close a poll, and a closed poll takes no votes', async () => {
    const poll = await createPoll(first, await createEvent(first));

    const byOtherMember = await request(app).post(`/api/polls/${poll.id}/close`).set(bearer(second)).send({});
    expect(byOtherMember.status).toBe(403);

    const byAdmin = await request(app)
      .post(`/api/polls/${poll.id}/close`)
      .set(bearer(family.admin))
      .send({ selectedOptionId: poll.sunday });
    expect(byAdmin.status).toBe(200);
    expect(byAdmin.body.data.poll.isClosed).toBe(true);
    expect(String(byAdmin.body.data.poll.selectedOption)).toBe(poll.sunday);

    const late = await vote(second, poll.id, poll.saturday, 'yes');
    expect(late.status).toBe(400);
  });

  it('closes itself once its deadline has passed', async () => {
    const poll = await createPoll(family.admin, await createEvent(family.admin), { deadline: daysFromNow(-1) });

    const res = await vote(first, poll.id, poll.saturday, 'yes');
    expect(res.status).toBe(400);

    const read = await request(app).get(`/api/polls/${poll.id}`).set(bearer(first));
    expect(read.body.data.poll.isClosed).toBe(true);
  });

  it('lets a guest read a poll but not vote in it', async () => {
    const poll = await createPoll(family.admin, await createEvent(family.admin));
    const guest = await joinFamily(family.inviteCode, { fullName: 'Visiting Cousin' });
    const role = await request(app).put(`/api/family/members/${guest.id}/role`).set(bearer(family.admin)).send({ role: 'guest' });
    expect(role.status).toBe(200);

    expect((await request(app).get(`/api/polls/${poll.id}`).set(bearer(guest))).status).toBe(200);
    const res = await vote(guest, poll.id, poll.saturday, 'yes');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('GUEST_READ_ONLY');
  });
});
