const request = require('supertest');
const { app } = require('../../server');

let counter = 0;
const uniqueEmail = (prefix = 'user') => {
  counter += 1;
  return `${prefix}_${Date.now()}_${counter}@test.local`;
};

/** Register a user and return their token, id and email. */
async function registerUser({ fullName = 'Test User', memberType, dateOfBirth } = {}) {
  const email = uniqueEmail(fullName.split(' ')[0].toLowerCase());
  const res = await request(app)
    .post('/api/auth/register')
    .send({ fullName, email, password: 'Password123!', memberType, dateOfBirth });

  return {
    token: res.body?.data?.accessToken,
    id: res.body?.data?.user?._id,
    email,
    fullName,
    res,
  };
}

/** Register a user, create a family, and return both. */
async function createFamilyWithAdmin(familyName = 'Test Family') {
  const admin = await registerUser({ fullName: 'Family Admin' });
  const res = await request(app)
    .post('/api/family/create')
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ name: familyName });

  return {
    admin,
    family: res.body?.data?.family,
    familyId: res.body?.data?.family?._id,
    inviteCode: res.body?.data?.family?.inviteCode,
  };
}

/** Register a user and join them to a family by invite code. */
async function joinFamily(inviteCode, opts = {}) {
  const user = await registerUser(opts);
  const res = await request(app)
    .post('/api/family/join')
    .set('Authorization', `Bearer ${user.token}`)
    .send({ inviteCode });
  return { ...user, joinRes: res };
}

/** Authenticated supertest agent shorthand. */
const auth = (token) => (req) => req.set('Authorization', `Bearer ${token}`);

module.exports = { app, request, registerUser, createFamilyWithAdmin, joinFamily, auth, uniqueEmail };
