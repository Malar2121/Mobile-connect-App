/*
 * QA Socket.io Live Test — verifies JWT handshake, room join, realtime message
 * broadcast, typing indicators, and auth rejection.
 * Run with the server up:  node scripts/qaSocketTest.js
 */
const { io } = require('socket.io-client');

const BASE = process.env.QA_BASE || 'http://localhost:5000';
const API = BASE;
const pwd = 'Password123!';
const results = [];
function record(name, ok, detail) {
  results.push({ name, status: ok ? 'PASS' : 'FAIL', detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] Socket :: ${name}${detail ? ' — ' + detail : ''}`);
}

async function api(method, url, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API}${url}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

const uniq = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

function connect(token) {
  return io(BASE, { auth: { token }, transports: ['websocket'], reconnection: false, forceNew: true });
}

async function run() {
  // Setup: 2 users in one family
  const aEmail = `sock_a_${uniq()}@t.com`;
  const bEmail = `sock_b_${uniq()}@t.com`;
  let r = await api('POST', '/api/auth/register', { body: { fullName: 'Sock A', email: aEmail, password: pwd } });
  const aTok = r.data.data.accessToken;
  r = await api('POST', '/api/auth/register', { body: { fullName: 'Sock B', email: bEmail, password: pwd } });
  const bTok = r.data.data.accessToken;

  r = await api('POST', '/api/family/create', { token: aTok, body: { name: 'Sock Family' } });
  r = await api('POST', '/api/family/invite', { token: aTok, body: {} });
  const code = r.data.data.inviteCode;
  await api('POST', '/api/family/join', { token: bTok, body: { inviteCode: code } });

  // Re-login to refresh tokens carrying updated familyId context (not needed; token has id only)

  // Test 1: connect with valid token
  const socketA = connect(aTok);
  const socketB = connect(bTok);

  await new Promise((resolve) => {
    let aReady = false, bReady = false;
    const done = () => { if (aReady && bReady) resolve(); };
    socketA.on('connect', () => { aReady = true; done(); });
    socketB.on('connect', () => { bReady = true; done(); });
    setTimeout(resolve, 4000);
  });
  record('Connect with valid JWT (A)', socketA.connected, `connected=${socketA.connected}`);
  record('Connect with valid JWT (B)', socketB.connected, `connected=${socketB.connected}`);

  // Test 2: realtime message via socket send_message reaches the other member
  const gotMessage = new Promise((resolve) => {
    socketB.on('new_message', (msg) => resolve(msg));
    setTimeout(() => resolve(null), 5000);
  });
  socketA.emit('send_message', { text: 'Hello over socket' });
  const msg = await gotMessage;
  record('Realtime message broadcast to family room', !!msg && msg.text === 'Hello over socket', msg ? `text="${msg.text}"` : 'no message received');

  // Test 3: REST-sent message also broadcasts over socket (new_message)
  const gotRest = new Promise((resolve) => {
    socketB.once('new_message', (m) => resolve(m));
    setTimeout(() => resolve(null), 5000);
  });
  await api('POST', '/api/chat/send', { token: aTok, body: { text: 'REST broadcast' } });
  const restMsg = await gotRest;
  record('REST message emits socket new_message', !!restMsg, restMsg ? `text="${restMsg.text}"` : 'not received');

  // Test 4: typing indicator
  const gotTyping = new Promise((resolve) => {
    socketB.once('typing', (t) => resolve(t));
    setTimeout(() => resolve(null), 4000);
  });
  socketA.emit('typing');
  const typing = await gotTyping;
  record('Typing indicator relayed', !!typing && !!typing.name, typing ? `from=${typing.name}` : 'not received');

  // Test 5: connection rejected without token
  const badSocket = connect(undefined);
  const rejected = await new Promise((resolve) => {
    badSocket.on('connect_error', (err) => resolve(err.message));
    badSocket.on('connect', () => resolve(null));
    setTimeout(() => resolve('timeout'), 4000);
  });
  record('Connection without token rejected', rejected && rejected !== null && rejected !== 'timeout' ? true : rejected === 'timeout' ? false : !badSocket.connected, `err=${rejected}`);
  badSocket.close();

  // Test 6: connection rejected with invalid token
  const badSocket2 = connect('garbage.token.here');
  const rejected2 = await new Promise((resolve) => {
    badSocket2.on('connect_error', (err) => resolve(err.message));
    badSocket2.on('connect', () => resolve(null));
    setTimeout(() => resolve('timeout'), 4000);
  });
  record('Connection with invalid token rejected', !!rejected2 && rejected2 !== 'timeout', `err=${rejected2}`);
  badSocket2.close();

  socketA.close();
  socketB.close();

  const passed = results.filter((x) => x.status === 'PASS').length;
  console.log(`\nSOCKET TOTAL ${results.length} | PASS ${passed} | FAIL ${results.length - passed}`);

  const fs = require('fs');
  const path = require('path');
  const outDir = path.join(__dirname, '..', '..', 'docs', 'qa');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'socket-results.json'), JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
  process.exit(0);
}

run().catch((e) => { console.error('SOCKET HARNESS ERROR:', e); process.exit(1); });
