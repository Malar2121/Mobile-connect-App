const { app, request, registerUser, createFamilyWithAdmin, joinFamily } = require('../helpers/factories');
const Invitation = require('../../models/Invitation');

/**
 * Email invitations (proposal §6.3 — "secure onboarding via email or QR code").
 *
 * SMTP is intentionally not configured in the test environment, so these
 * exercise the full code path and assert that the API reports emailSent:false
 * rather than claiming a delivery that never happened.
 */
describe('Email invitations (proposal §6.3)', () => {
  let family;

  beforeEach(async () => {
    family = await createFamilyWithAdmin('Invite Family');
  });

  const invite = (token, body) =>
    request(app).post('/api/family/invitations').set('Authorization', `Bearer ${token}`).send(body);

  describe('creating an invitation', () => {
    it('creates one and reports honestly that mail is not configured', async () => {
      const res = await invite(family.admin.token, { email: 'newcomer@test.local' });

      expect(res.status).toBe(201);
      expect(res.body.data.invitation.email).toBe('newcomer@test.local');
      expect(res.body.data.emailSent).toBe(false);
      expect(res.body.data.deliveryReason).toBe('mail_not_configured');
      expect(res.body.data.invitation.emailSent).toBe(false);
    });

    it('returns the token to the inviter only because delivery failed', async () => {
      const res = await invite(family.admin.token, { email: 'fallback@test.local' });
      expect(res.body.data.token).toBeTruthy();
    });

    it('never stores the raw token, only its hash', async () => {
      const res = await invite(family.admin.token, { email: 'hashed@test.local' });
      const raw = res.body.data.token;

      const stored = await Invitation.findOne({ email: 'hashed@test.local' });
      expect(stored.tokenHash).not.toBe(raw);
      expect(stored.tokenHash).toBe(Invitation.hashToken(raw));
      expect(JSON.stringify(stored.toObject())).not.toContain(raw);
    });

    it('never exposes the token hash in a response', async () => {
      const res = await invite(family.admin.token, { email: 'nohash@test.local' });
      expect(JSON.stringify(res.body)).not.toMatch(/tokenHash/);
    });

    it('rejects a malformed email address', async () => {
      const res = await invite(family.admin.token, { email: 'not-an-email' });
      expect(res.status).toBe(400);
    });

    it('refuses to grant admin rights by invitation', async () => {
      const res = await invite(family.admin.token, { email: 'wannabe@test.local', role: 'admin' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/admin rights cannot be granted/i);
    });

    it('lets a parent invite but not an ordinary member', async () => {
      const member = await joinFamily(family.inviteCode, { fullName: 'Plain Member' });
      const denied = await invite(member.token, { email: 'nope@test.local' });
      expect(denied.status).toBe(403);

      await request(app)
        .put(`/api/family/members/${member.id}/role`)
        .set('Authorization', `Bearer ${family.admin.token}`)
        .send({ role: 'parent' });

      const allowed = await invite(member.token, { email: 'yes@test.local' });
      expect(allowed.status).toBe(201);
    });

    it('refuses to invite someone who already belongs to a family', async () => {
      const other = await createFamilyWithAdmin('Other Family');
      const res = await invite(family.admin.token, { email: other.admin.email });
      expect(res.status).toBe(409);
    });

    it('re-inviting the same address refreshes rather than duplicating', async () => {
      const first = await invite(family.admin.token, { email: 'again@test.local' });
      const second = await invite(family.admin.token, { email: 'again@test.local' });

      expect(second.status).toBe(201);
      expect(await Invitation.countDocuments({ email: 'again@test.local' })).toBe(1);

      // The earlier token must no longer work.
      const invitee = await registerUser({ fullName: 'Again User' });
      const stale = await request(app)
        .post('/api/family/invitations/accept')
        .set('Authorization', `Bearer ${invitee.token}`)
        .send({ token: first.body.data.token });
      expect(stale.status).toBe(404);
    });
  });

  describe('accepting an invitation', () => {
    async function inviteAndRegister(email = 'accepter@test.local') {
      const res = await invite(family.admin.token, { email });
      const user = await registerUser({ fullName: 'Invited Person' });
      // Align the account's email with the invitation.
      const User = require('../../models/User');
      await User.findByIdAndUpdate(user.id, { email });
      return { token: res.body.data.token, user, id: res.body.data.invitation._id };
    }

    it('joins the family with the invited role', async () => {
      const { token, user } = await inviteAndRegister();
      const res = await request(app)
        .post('/api/family/invitations/accept')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ token });

      expect(res.status).toBe(200);
      expect(res.body.data.family.name).toBe('Invite Family');

      const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${user.token}`);
      expect(me.body.data.user.role).toBe('member');
    });

    it('is single use — the same token cannot be replayed', async () => {
      const { token, user } = await inviteAndRegister('single@test.local');

      const first = await request(app)
        .post('/api/family/invitations/accept')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ token });
      expect(first.status).toBe(200);

      // Leave, so the only thing that can block a second use is the token
      // itself having been consumed — not "already in a family".
      await request(app).delete('/api/family/leave').set('Authorization', `Bearer ${user.token}`);

      const res = await request(app)
        .post('/api/family/invitations/accept')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ token });
      expect(res.status).toBe(410);
      expect(res.body.code).toBe('USED');
    });

    it('refuses a token addressed to a different email', async () => {
      const { token } = await inviteAndRegister('intended@test.local');
      const stranger = await registerUser({ fullName: 'Stranger' });

      const res = await request(app)
        .post('/api/family/invitations/accept')
        .set('Authorization', `Bearer ${stranger.token}`)
        .send({ token });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('WRONG_ACCOUNT');
    });

    it('refuses an expired invitation', async () => {
      const { token, user } = await inviteAndRegister('expired@test.local');
      await Invitation.updateOne(
        { email: 'expired@test.local' },
        { expiresAt: new Date(Date.now() - 1000) },
      );

      const res = await request(app)
        .post('/api/family/invitations/accept')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ token });
      expect(res.status).toBe(410);
      expect(res.body.code).toBe('EXPIRED');
    });

    it('refuses a revoked invitation', async () => {
      const { token, user, id } = await inviteAndRegister('revoked@test.local');
      await request(app)
        .delete(`/api/family/invitations/${id}`)
        .set('Authorization', `Bearer ${family.admin.token}`);

      const res = await request(app)
        .post('/api/family/invitations/accept')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ token });
      expect(res.status).toBe(410);
      expect(res.body.code).toBe('REVOKED');
    });

    it('refuses a forged token', async () => {
      const user = await registerUser({ fullName: 'Forger' });
      const res = await request(app)
        .post('/api/family/invitations/accept')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ token: 'a'.repeat(64) });
      expect(res.status).toBe(404);
    });

    it('refuses when the accepter is already in a family', async () => {
      const { token } = await inviteAndRegister('busy@test.local');
      const other = await createFamilyWithAdmin('Busy Family');
      const res = await request(app)
        .post('/api/family/invitations/accept')
        .set('Authorization', `Bearer ${other.admin.token}`)
        .send({ token });
      expect(res.status).toBe(400);
    });

    it('still requires guardian approval for a minor', async () => {
      const res = await invite(family.admin.token, { email: 'minor@test.local' });
      const minor = await registerUser({ fullName: 'Invited Minor', memberType: 'child' });
      const User = require('../../models/User');
      await User.findByIdAndUpdate(minor.id, { email: 'minor@test.local' });

      const accept = await request(app)
        .post('/api/family/invitations/accept')
        .set('Authorization', `Bearer ${minor.token}`)
        .send({ token: res.body.data.token });
      expect(accept.body.data.consentRequired).toBe(true);

      const blocked = await request(app).get('/api/memories').set('Authorization', `Bearer ${minor.token}`);
      expect(blocked.status).toBe(403);
      expect(blocked.body.code).toBe('CONSENT_PENDING');
    });
  });

  describe('verifying before accepting', () => {
    it('returns only the family name, never its members or id', async () => {
      const created = await invite(family.admin.token, { email: 'peek@test.local' });
      const user = await registerUser({ fullName: 'Peeker' });

      const res = await request(app)
        .get(`/api/family/invitations/verify/${created.body.data.token}`)
        .set('Authorization', `Bearer ${user.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.familyName).toBe('Invite Family');
      expect(res.body.data.members).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain(family.familyId);
    });

    it('reports an invalid token without leaking anything', async () => {
      const user = await registerUser({ fullName: 'Prober' });
      const res = await request(app)
        .get(`/api/family/invitations/verify/${'b'.repeat(64)}`)
        .set('Authorization', `Bearer ${user.token}`);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('INVALID');
    });
  });

  describe('managing invitations', () => {
    it("never lists or revokes another family's invitations", async () => {
      const created = await invite(family.admin.token, { email: 'mine@test.local' });
      const other = await createFamilyWithAdmin('Nosy Family');

      const list = await request(app)
        .get('/api/family/invitations')
        .set('Authorization', `Bearer ${other.admin.token}`);
      expect(list.body.data).toHaveLength(0);

      const revoke = await request(app)
        .delete(`/api/family/invitations/${created.body.data.invitation._id}`)
        .set('Authorization', `Bearer ${other.admin.token}`);
      expect(revoke.status).toBe(404);
    });

    it('shows an expired invitation as expired in the listing', async () => {
      await invite(family.admin.token, { email: 'stale@test.local' });
      await Invitation.updateOne({ email: 'stale@test.local' }, { expiresAt: new Date(Date.now() - 1000) });

      const res = await request(app)
        .get('/api/family/invitations')
        .set('Authorization', `Bearer ${family.admin.token}`);
      expect(res.body.data[0].status).toBe('expired');
    });
  });
});
