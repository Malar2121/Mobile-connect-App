// Tight read limit for this file only. server.js reads these values when it
// is first loaded, which happens through the factories below.
process.env.READ_RATE_LIMIT_MAX = '5';
process.env.RATE_LIMIT_MAX = '1000';

const { app, request, registerUser } = require('../helpers/factories');

/**
 * Rate limiting must stop abuse without breaking normal use: several family
 * members often share one Wi-Fi network, and the app makes several reads each
 * time a screen opens.
 */
describe('API rate limiting', () => {
  const me = (user) => request(app).get('/api/auth/me').set('Authorization', `Bearer ${user.token}`);

  it('limits each signed-in member separately and keeps reads apart from writes', async () => {
    const busy = await registerUser({ fullName: 'Busy Member' });
    const quiet = await registerUser({ fullName: 'Quiet Member' });

    for (let i = 0; i < 5; i += 1) {
      expect((await me(busy)).status).toBe(200);
    }

    const limited = await me(busy);
    expect(limited.status).toBe(429);
    expect(limited.body.code).toBe('RATE_LIMITED');

    // Another member on the same network is unaffected.
    expect((await me(quiet)).status).toBe(200);

    // Browsing has not used up the allowance for making changes.
    const write = await request(app)
      .post('/api/family/create')
      .set('Authorization', `Bearer ${busy.token}`)
      .send({ name: 'Still Allowed' });
    expect(write.status).toBe(201);
  });
});
