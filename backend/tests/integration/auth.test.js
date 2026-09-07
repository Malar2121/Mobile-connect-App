const { app, request, registerUser } = require('../helpers/factories');

describe('Authentication (proposal Objective 1)', () => {
  it('registers a user and returns an access token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'New User',
      email: `new_${Date.now()}@test.local`,
      password: 'Password123!',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('never returns the password hash', async () => {
    const { res } = await registerUser({ fullName: 'Secret Holder' });
    expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/); // bcrypt prefix
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('refuses a duplicate email', async () => {
    const email = `dupe_${Date.now()}@test.local`;
    const body = { fullName: 'First', email, password: 'Password123!' };
    await request(app).post('/api/auth/register').send(body);
    const res = await request(app).post('/api/auth/register').send(body);
    // 409 Conflict — the resource already exists.
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('refuses a password shorter than the schema minimum', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Short Pass',
      email: `short_${Date.now()}@test.local`,
      password: 'abc',
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('does not let a new account claim the admin role', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Would Be Admin',
      email: `admin_${Date.now()}@test.local`,
      password: 'Password123!',
      role: 'admin',
    });
    expect(res.body.data.user.role).toBe('member');
  });

  it('logs in with correct credentials', async () => {
    const user = await registerUser({ fullName: 'Login User' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('rejects a wrong password without revealing which field was wrong', async () => {
    const user = await registerUser({ fullName: 'Login User' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'WrongPassword1!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('rejects a login for an unknown email with the same message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.local', password: 'Password123!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('resists a NoSQL injection attempt in the login body', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $ne: null }, password: { $ne: null } });

    expect(res.status).not.toBe(200);
  });

  it('rejects a protected request with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with the wrong secret', async () => {
    const jwt = require('jsonwebtoken');
    const forged = jwt.sign({ id: '507f1f77bcf86cd799439011' }, 'the-wrong-secret');
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const jwt = require('jsonwebtoken');
    const user = await registerUser({ fullName: 'Expiry User' });
    const expired = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '-1s' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/expired/i);
  });

  it('returns the signed-in user for a valid token', async () => {
    const user = await registerUser({ fullName: 'Me User' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.fullName).toBe('Me User');
  });
});
