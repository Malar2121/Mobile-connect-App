const Notification = require('../../models/Notification');
const { app, request, createFamilyWithAdmin, joinFamily } = require('../helpers/factories');

async function waitFor(check, timeoutMs = 3000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const value = await check();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return null;
}

/** Proposal §6.3: English, Sinhala and Tamil — including what the server sends. */
describe('Notifications in each member’s language', () => {
  it('stores the language a member chooses and notifies them in it', async () => {
    const family = await createFamilyWithAdmin('Language Family');
    const sinhala = await joinFamily(family.inviteCode, { fullName: 'Sinhala Reader' });
    const tamil = await joinFamily(family.inviteCode, { fullName: 'Tamil Reader' });
    const author = await joinFamily(family.inviteCode, { fullName: 'Story Author' });

    const setSi = await request(app).patch('/api/auth/me').set('Authorization', `Bearer ${sinhala.token}`).send({ language: 'si' });
    expect(setSi.body.data.user.language).toBe('si');
    await request(app).patch('/api/auth/me').set('Authorization', `Bearer ${tamil.token}`).send({ language: 'ta' });

    const ignored = await request(app).patch('/api/auth/me').set('Authorization', `Bearer ${tamil.token}`).send({ language: 'fr' });
    expect(ignored.body.data.user.language).toBe('ta');

    await request(app)
      .post('/api/stories')
      .set('Authorization', `Bearer ${author.token}`)
      .send({ title: 'Our village', body: 'Written in any language' });

    const forSinhala = await waitFor(() => Notification.findOne({ recipient: sinhala.id, type: 'story_created' }));
    const forTamil = await waitFor(() => Notification.findOne({ recipient: tamil.id, type: 'story_created' }));
    const forAdmin = await waitFor(() => Notification.findOne({ recipient: family.admin.id, type: 'story_created' }));

    expect(forSinhala.title).toMatch(/[඀-෿]/);
    expect(forTamil.title).toMatch(/[஀-௿]/);
    expect(forAdmin.title).toBe('Story Author shared a family story');

    // The story title is the author's own words and is never translated.
    for (const notification of [forSinhala, forTamil, forAdmin]) {
      expect(notification.body).toBe('Our village');
    }
  });
});
