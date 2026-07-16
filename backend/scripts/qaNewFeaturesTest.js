/**
 * QA harness — new safety & security features
 * Covers: member types, safe zones CRUD + geofence alerts,
 * location history, sharing policy, and TOTP two-factor auth.
 *
 * Run with the server already up (local MongoDB):
 *   node scripts/qaNewFeaturesTest.js
 * Override target with QA_BASE (default http://localhost:5000).
 */

const { authenticator } = require('otplib');

const BASE = process.env.QA_BASE || 'http://localhost:5000';
const API = `${BASE}/api`;

const results = [];
let pass = 0;
let fail = 0;

const record = (id, name, ok, detail = '') => {
  results.push({ id, name, ok, detail });
  if (ok) pass += 1;
  else fail += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const req = async (method, path, { token, body } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON */
  }
  return { status: res.status, json };
};

const uniq = Date.now();

const main = async () => {
  // ── Setup: parent (family admin), child, elder, outsider ──
  const users = {};
  for (const [key, memberType, role] of [
    ['parent', 'adult', 'parent'],
    ['child', 'child', 'child'],
    ['elder', 'elder', 'member'],
    ['outsider', 'adult', 'member'],
  ]) {
    const r = await req('POST', '/auth/register', {
      body: {
        fullName: `QA ${key} ${uniq}`,
        email: `qa_${key}_${uniq}@test.local`,
        password: 'Password123!',
        role,
        memberType,
      },
    });
    users[key] = {
      token: r.json?.data?.accessToken,
      id: r.json?.data?.user?._id,
      email: `qa_${key}_${uniq}@test.local`,
    };
    if (!users[key].token) throw new Error(`registration failed for ${key}: ${JSON.stringify(r.json)}`);
  }

  record('NF-01', 'Register accepts memberType child/elder', true);

  // Privilege escalation guard: role:"admin" at register must be ignored
  const escalate = await req('POST', '/auth/register', {
    body: {
      fullName: `QA escalate ${uniq}`,
      email: `qa_escalate_${uniq}@test.local`,
      password: 'Password123!',
      role: 'admin',
    },
  });
  record(
    'NF-02',
    'Self-registration cannot claim admin role',
    escalate.json?.data?.user?.role !== 'admin',
    `role=${escalate.json?.data?.user?.role}`,
  );

  // ── Family setup ──
  const fam = await req('POST', '/family/create', {
    token: users.parent.token,
    body: { name: `QA Family ${uniq}` },
  });
  const inviteCode = fam.json?.data?.family?.inviteCode;
  record('NF-03', 'Family created', fam.status === 201 && !!inviteCode);

  // Disable join approval so members join instantly
  await req('PATCH', '/family', {
    token: users.parent.token,
    body: { privacySettings: { requireApproval: false, allowLocationSharing: true } },
  });

  for (const key of ['child', 'elder']) {
    const j = await req('POST', '/family/join', { token: users[key].token, body: { inviteCode } });
    record(`NF-04${key === 'child' ? 'a' : 'b'}`, `${key} joined family`, j.status === 200, `status=${j.status}`);
  }

  // memberType visible in family payload
  const myFam = await req('GET', '/family/my-family', { token: users.parent.token });
  const memberTypes = (myFam.json?.data?.family?.members || []).map((m) => m.memberType);
  record('NF-05', 'Family members expose memberType', memberTypes.includes('child') && memberTypes.includes('elder'));

  // Admin sets member type
  const setType = await req('PUT', `/family/members/${users.elder.id}/type`, {
    token: users.parent.token,
    body: { memberType: 'elder', dateOfBirth: '1950-04-12' },
  });
  record('NF-06', 'Admin can set member type + dateOfBirth', setType.status === 200);

  const setTypeByChild = await req('PUT', `/family/members/${users.parent.id}/type`, {
    token: users.child.token,
    body: { memberType: 'adult' },
  });
  record('NF-07', 'Non-admin cannot set member type', setTypeByChild.status === 403);

  // ── Safe zones ──
  const zoneBody = {
    name: 'QA Home',
    latitude: 6.9,
    longitude: 79.86,
    radius: 200,
    type: 'home',
  };
  const zoneByChild = await req('POST', '/safezones', { token: users.child.token, body: zoneBody });
  record('NF-08', 'Child cannot create safe zone', zoneByChild.status === 403);

  const zone = await req('POST', '/safezones', { token: users.parent.token, body: zoneBody });
  const zoneId = zone.json?.data?._id;
  record('NF-09', 'Parent/admin creates safe zone', zone.status === 201 && !!zoneId);

  const zoneBadCoords = await req('POST', '/safezones', {
    token: users.parent.token,
    body: { ...zoneBody, latitude: 999 },
  });
  record('NF-10', 'Safe zone rejects invalid coordinates', zoneBadCoords.status === 400);

  const zoneList = await req('GET', '/safezones', { token: users.child.token });
  record('NF-11', 'Members can list safe zones', zoneList.status === 200 && zoneList.json?.data?.length >= 1);

  const outsiderZones = await req('GET', '/safezones', { token: users.outsider.token });
  record('NF-12', 'Outsider (no family) cannot list zones', outsiderZones.status === 403);

  // ── Geofence enter/exit via location updates ──
  // Start outside the zone
  const upd1 = await req('POST', '/location/update', {
    token: users.child.token,
    body: { latitude: 6.95, longitude: 79.9, battery: 80 },
  });
  record('NF-13', 'Location update works', upd1.status === 200);

  // Move inside the zone → enter alert + currentZoneIds set
  const upd2 = await req('POST', '/location/update', {
    token: users.child.token,
    body: { latitude: 6.9001, longitude: 79.8601, battery: 79 },
  });
  const insideZones = (upd2.json?.data?.currentZoneIds || []).map(String);
  record('NF-14', 'Entering zone records zone membership', insideZones.includes(String(zoneId)));

  // Parent should have received a geofence notification
  await new Promise((r) => setTimeout(r, 800));
  const notif = await req('GET', '/notifications', { token: users.parent.token });
  const list = notif.json?.data?.notifications || notif.json?.data || [];
  const hasGeofence = (Array.isArray(list) ? list : []).some(
    (n) => n.type === 'geofence_alert' || /arrived at QA Home/i.test(n.title || ''),
  );
  record('NF-15', 'Geofence enter notification created', hasGeofence);

  // Move outside → exit + zone membership cleared
  const upd3 = await req('POST', '/location/update', {
    token: users.child.token,
    body: { latitude: 6.95, longitude: 79.9 },
  });
  const zonesAfterExit = (upd3.json?.data?.currentZoneIds || []).map(String);
  record('NF-16', 'Exiting zone clears zone membership', !zonesAfterExit.includes(String(zoneId)));

  const badCoords = await req('POST', '/location/update', {
    token: users.child.token,
    body: { latitude: 123, longitude: 500 },
  });
  record('NF-17', 'Location update rejects invalid coordinates', badCoords.status === 400);

  // ── Location history ──
  const histSelf = await req('GET', `/location/history/${users.child.id}?hours=24`, { token: users.child.token });
  record(
    'NF-18',
    'Self can read own history (points recorded)',
    histSelf.status === 200 && (histSelf.json?.data?.points?.length || 0) >= 1,
    `points=${histSelf.json?.data?.points?.length}`,
  );

  const histParent = await req('GET', `/location/history/${users.child.id}`, { token: users.parent.token });
  record('NF-19', 'Parent can read child history', histParent.status === 200);

  const histOutsider = await req('GET', `/location/history/${users.child.id}`, { token: users.outsider.token });
  record('NF-20', 'Outsider cannot read history', histOutsider.status === 403 || histOutsider.status === 404);

  const histBadId = await req('GET', '/location/history/notanid', { token: users.parent.token });
  record('NF-21', 'History rejects malformed id with 400', histBadId.status === 400);

  // ── Sharing policy ──
  const childPause = await req('POST', '/location/sharing', { token: users.child.token, body: { enabled: false } });
  record('NF-22', 'Child cannot pause sharing (safety policy)', childPause.status === 403);

  const elderPause = await req('POST', '/location/sharing', { token: users.elder.token, body: { enabled: false } });
  record('NF-23', 'Elder cannot pause sharing (safety policy)', elderPause.status === 403);

  const parentPause = await req('POST', '/location/sharing', { token: users.parent.token, body: { enabled: false } });
  record('NF-24', 'Adult can pause sharing', parentPause.status === 200);

  // Paused adult hidden from family map
  await req('POST', '/location/update', { token: users.parent.token, body: { latitude: 6.91, longitude: 79.87 } });
  const famLoc = await req('GET', '/location/family', { token: users.child.token });
  const visibleIds = (famLoc.json?.data || []).map((l) => String(l.userId?._id || l.userId));
  record('NF-25', 'Paused member hidden from family locations', !visibleIds.includes(String(users.parent.id)));

  await req('POST', '/location/sharing', { token: users.parent.token, body: { enabled: true } });

  // Family locations expose memberType for map badges
  const famLoc2 = await req('GET', '/location/family', { token: users.parent.token });
  const hasType = (famLoc2.json?.data || []).some((l) => ['child', 'elder', 'adult'].includes(l.userId?.memberType));
  record('NF-26', 'Family locations expose memberType', hasType);

  // ── Malformed id regression (BUG-L1) ──
  const badEvent = await req('GET', '/events/notanid', { token: users.parent.token });
  record('NF-27', 'Malformed event id returns 400 (BUG-L1)', badEvent.status === 400, `status=${badEvent.status}`);

  const badLegacy = await req('GET', '/legacy/notanid', { token: users.parent.token });
  record('NF-28', 'Malformed legacy id returns 400 (BUG-L1)', badLegacy.status === 400, `status=${badLegacy.status}`);

  // ── Unauthenticated geofence webhook is rejected ──
  const webhook = await fetch(`${API}/webhooks/geofence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: users.child.id, familyId: 'x', action: 'enter' }),
  });
  record('NF-29', 'Geofence webhook requires auth', webhook.status === 401);

  // ── Two-factor authentication (TOTP) ──
  const setup = await req('POST', '/auth/2fa/setup', { token: users.parent.token });
  const secret = setup.json?.data?.secret;
  record('NF-30', '2FA setup returns secret + otpauth URL', setup.status === 200 && !!secret && !!setup.json?.data?.otpauthUrl);

  const wrongVerify = await req('POST', '/auth/2fa/verify', { token: users.parent.token, body: { code: '000000' } });
  record('NF-31', '2FA verify rejects wrong code', wrongVerify.status === 401);

  const goodCode = authenticator.generate(secret);
  const verify = await req('POST', '/auth/2fa/verify', { token: users.parent.token, body: { code: goodCode } });
  record('NF-32', '2FA verify accepts valid code', verify.status === 200);

  // Login now requires the second factor
  const login = await req('POST', '/auth/login', {
    body: { email: users.parent.email, password: 'Password123!' },
  });
  const tempToken = login.json?.data?.tempToken;
  record(
    'NF-33',
    'Login with 2FA returns tempToken, no access token',
    login.status === 200 && login.json?.data?.requires2FA === true && !login.json?.data?.accessToken,
  );

  const badLogin2fa = await req('POST', '/auth/2fa/login', { body: { tempToken, code: '000000' } });
  record('NF-34', '2FA login rejects wrong code', badLogin2fa.status === 401);

  const login2fa = await req('POST', '/auth/2fa/login', {
    body: { tempToken, code: authenticator.generate(secret) },
  });
  const newAccess = login2fa.json?.data?.accessToken;
  record('NF-35', '2FA login issues tokens with valid code', login2fa.status === 200 && !!newAccess);

  // Access token cannot be used as tempToken (purpose check)
  const purposeCheck = await req('POST', '/auth/2fa/login', {
    body: { tempToken: newAccess, code: authenticator.generate(secret) },
  });
  record('NF-36', 'Access token rejected as 2FA session token', purposeCheck.status === 401);

  const disable = await req('POST', '/auth/2fa/disable', {
    token: newAccess,
    body: { code: authenticator.generate(secret) },
  });
  record('NF-37', '2FA disable works with valid code', disable.status === 200);

  const loginAfter = await req('POST', '/auth/login', {
    body: { email: users.parent.email, password: 'Password123!' },
  });
  record('NF-38', 'Login returns tokens again after 2FA disable', !!loginAfter.json?.data?.accessToken);

  // ── Cleanup zone ──
  const delZone = await req('DELETE', `/safezones/${zoneId}`, { token: users.parent.token });
  record('NF-39', 'Safe zone deleted', delZone.status === 200);

  console.log(`\n${pass}/${pass + fail} passed, ${fail} failed`);
  try {
    const fs = require('fs');
    const path = require('path');
    const outDir = path.join(__dirname, '..', '..', 'docs', 'qa');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, 'new-features-results.json'),
      JSON.stringify({ ranAt: new Date().toISOString(), base: BASE, pass, fail, results }, null, 2),
    );
    console.log('Results written to docs/qa/new-features-results.json');
  } catch (e) {
    console.warn('Could not write results file:', e.message);
  }
  process.exit(fail ? 1 : 0);
};

main().catch((e) => {
  console.error('Harness crashed:', e);
  process.exit(1);
});
