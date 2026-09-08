const { app, request, createFamilyWithAdmin, joinFamily } = require('../helpers/factories');

/**
 * Performance measurement (proposal Objective 8 — "Test usability, performance,
 * and real-world adoption with families").
 *
 * The proposal states no numeric target, so none is invented here. These tests
 * assert only two things that are genuinely justified:
 *
 *   1. Bounded work — a request must not get slower in proportion to the whole
 *      family's history. Reads are paginated or capped, and that is asserted by
 *      growing the dataset and checking the response size stays bounded.
 *   2. A generous ceiling that catches a pathology (a missing index, an
 *      accidental N+1) rather than a claim about production latency.
 *
 * Measured timings are printed so they can be recorded in the test report as
 * observations, not as pass/fail thresholds.
 */

// Deliberately loose: this exists to catch an order-of-magnitude regression on
// a developer machine, not to certify production latency.
const PATHOLOGY_CEILING_MS = 2000;

const timings = [];

async function measure(label, fn) {
  const started = process.hrtime.bigint();
  const res = await fn();
  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  timings.push({ label, ms: Math.round(ms) });
  return { res, ms };
}

describe('API performance (proposal Objective 8)', () => {
  let family;
  let token;

  beforeEach(async () => {
    family = await createFamilyWithAdmin('Performance Family');
    token = family.admin.token;
  });

  afterAll(() => {
    if (timings.length === 0) return;
    console.log('\n      Measured response times (local, single machine):');
    timings.forEach((t) => console.log(`        ${t.label.padEnd(48)} ${String(t.ms).padStart(5)} ms`));
    console.log('      These are observations for the test report, not thresholds.\n');
  });

  describe('bounded reads', () => {
    it('caps chat history at the requested limit however many messages exist', async () => {
      // 120 messages, asking for 50.
      for (let i = 0; i < 120; i += 1) {
        await request(app)
          .post('/api/chat/send')
          .set('Authorization', `Bearer ${token}`)
          .send({ text: `perf message ${i}` });
      }

      const { res, ms } = await measure('GET /api/chat/messages?limit=50 (120 stored)', () =>
        request(app).get('/api/chat/messages?limit=50').set('Authorization', `Bearer ${token}`),
      );

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(50);
      expect(res.body.meta.hasMore).toBe(true);
      expect(ms).toBeLessThan(PATHOLOGY_CEILING_MS);
    });

    it('never returns more than the server-side maximum, even if asked', async () => {
      for (let i = 0; i < 30; i += 1) {
        await request(app)
          .post('/api/chat/send')
          .set('Authorization', `Bearer ${token}`)
          .send({ text: `bound ${i}` });
      }

      const res = await request(app)
        .get('/api/chat/messages?limit=100000')
        .set('Authorization', `Bearer ${token}`);

      // The controller clamps to 200; with 30 stored we simply get 30 back,
      // and critically the clamp means an attacker cannot request everything.
      expect(res.body.meta.limit).toBeLessThanOrEqual(200);
    });

    it('paginates albums rather than returning the whole collection', async () => {
      for (let i = 0; i < 25; i += 1) {
        await request(app)
          .post('/api/albums')
          .set('Authorization', `Bearer ${token}`)
          .send({ title: `Album ${i}` });
      }

      const { res } = await measure('GET /api/albums?limit=10 (25 stored)', () =>
        request(app).get('/api/albums?page=1&limit=10').set('Authorization', `Bearer ${token}`),
      );

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(10);
      expect(res.body.pagination.total).toBe(25);
    });
  });

  describe('response times under a realistic family workload', () => {
    beforeEach(async () => {
      // A plausible family: 5 members, 20 events, 20 celebrations, 40 messages.
      for (let i = 0; i < 4; i += 1) {
        await joinFamily(family.inviteCode, {
          fullName: `Member ${i}`,
          dateOfBirth: new Date(Date.UTC(1980 + i, i % 12, (i % 27) + 1)).toISOString(),
        });
      }
      for (let i = 0; i < 20; i += 1) {
        await request(app)
          .post('/api/events/create')
          .set('Authorization', `Bearer ${token}`)
          .send({ title: `Event ${i}`, date: new Date(Date.now() + (i + 1) * 86400000).toISOString() });
        await request(app)
          .post('/api/celebrations')
          .set('Authorization', `Bearer ${token}`)
          .send({
            type: 'cultural',
            title: `Festival ${i}`,
            date: new Date(Date.UTC(2015, i % 12, (i % 27) + 1)).toISOString(),
          });
      }
      for (let i = 0; i < 40; i += 1) {
        await request(app)
          .post('/api/chat/send')
          .set('Authorization', `Bearer ${token}`)
          .send({ text: `workload ${i}` });
      }
    });

    const cases = [
      ['GET /api/family/my-family', '/api/family/my-family'],
      ['GET /api/events', '/api/events'],
      ['GET /api/celebrations (incl. derived birthdays)', '/api/celebrations'],
      ['GET /api/memories', '/api/memories'],
      ['GET /api/chat/messages', '/api/chat/messages'],
      ['GET /api/family-tree', '/api/family-tree'],
      ['GET /api/notifications', '/api/notifications'],
    ];

    it.each(cases)('%s responds without a pathological delay', async (label, path) => {
      const { res, ms } = await measure(label, () =>
        request(app).get(path).set('Authorization', `Bearer ${token}`),
      );
      expect(res.status).toBe(200);
      expect(ms).toBeLessThan(PATHOLOGY_CEILING_MS);
    });

    it('serves concurrent reads from several family members', async () => {
      const started = process.hrtime.bigint();
      const results = await Promise.all(
        Array.from({ length: 10 }, () =>
          request(app).get('/api/events').set('Authorization', `Bearer ${token}`),
        ),
      );
      const ms = Number(process.hrtime.bigint() - started) / 1e6;
      timings.push({ label: '10 concurrent GET /api/events', ms: Math.round(ms) });

      results.forEach((r) => expect(r.status).toBe(200));
      expect(ms).toBeLessThan(PATHOLOGY_CEILING_MS * 3);
    });
  });

  describe('indexes that keep these reads bounded', () => {
    it('declares the indexes the hot read paths rely on', () => {
      const Message = require('../../models/Message');
      const Celebration = require('../../models/Celebration');
      const Invitation = require('../../models/Invitation');

      const indexed = (model) => model.schema.indexes().map(([spec]) => Object.keys(spec).join(','));

      // Chat reads are always family-scoped and time-ordered.
      expect(indexed(Message)).toContain('familyId,createdAt');
      // Celebration sweeps are family-scoped and date-ordered.
      expect(indexed(Celebration)).toContain('familyId,date');
      // Invitation acceptance looks up by token hash on every attempt.
      expect(Invitation.schema.path('tokenHash').options.index).toBe(true);
    });
  });
});
