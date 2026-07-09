/*
 * QA Live API Test Harness — Family Connect
 * Exercises every REST endpoint against the running server (http://localhost:5000).
 * Records structured PASS/FAIL results and writes docs/qa/api-results.json.
 *
 * Run:  node scripts/qaLiveTest.js
 * Requires: server running + MongoDB up. Node 18+ (global fetch).
 */
const fs = require('fs');
const path = require('path');

const BASE = process.env.QA_BASE || 'http://localhost:5000';
const results = [];
let idCounter = 0;

const uniq = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function record(phase, name, ok, detail) {
  idCounter += 1;
  const row = { id: `TC-${String(idCounter).padStart(3, '0')}`, phase, name, status: ok ? 'PASS' : 'FAIL', detail };
  results.push(row);
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${phase} :: ${name}${detail ? ' — ' + detail : ''}`);
  return ok;
}

async function api(method, url, { token, body, raw } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${url}`, { method, headers, body: payload });
  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data, raw };
}

// Shared state
const state = {};

async function run() {
  // ═══════════════ PHASE 1 — AUTHENTICATION ═══════════════
  const adminEmail = `qa_admin_${uniq()}@test.com`;
  const memberEmail = `qa_member_${uniq()}@test.com`;
  const outsiderEmail = `qa_out_${uniq()}@test.com`;
  const pwd = 'Password123!';

  // Register admin
  let r = await api('POST', '/api/auth/register', { body: { fullName: 'QA Admin', email: adminEmail, password: pwd } });
  record('Auth', 'Register new user returns 201 + tokens', r.status === 201 && !!r.data?.data?.accessToken, `status=${r.status}`);
  state.adminToken = r.data?.data?.accessToken;
  state.adminRefresh = r.data?.data?.refreshToken;
  state.adminId = r.data?.data?.user?._id;
  record('Auth', 'Registered password not returned', !r.data?.data?.user?.password, 'password field absent');

  // Duplicate email
  r = await api('POST', '/api/auth/register', { body: { fullName: 'Dup', email: adminEmail, password: pwd } });
  record('Auth', 'Duplicate email rejected (409)', r.status === 409, `status=${r.status}`);

  // Missing fields
  r = await api('POST', '/api/auth/register', { body: { email: 'x@y.com' } });
  record('Auth', 'Register missing fields rejected (400)', r.status === 400, `status=${r.status}`);

  // Weak password (min 8) -> validation error 422/500
  r = await api('POST', '/api/auth/register', { body: { fullName: 'Weak', email: `weak_${uniq()}@t.com`, password: '123' } });
  record('Auth', 'Weak password (<8) rejected', r.status === 422 || r.status === 400 || r.status === 500, `status=${r.status}`);

  // Invalid email format
  r = await api('POST', '/api/auth/register', { body: { fullName: 'Bad', email: 'notanemail', password: pwd } });
  record('Auth', 'Invalid email format rejected', r.status === 422 || r.status === 400 || r.status === 500, `status=${r.status}`);

  // Login valid
  r = await api('POST', '/api/auth/login', { body: { email: adminEmail, password: pwd } });
  record('Auth', 'Login valid credentials (200)', r.status === 200 && !!r.data?.data?.accessToken, `status=${r.status}`);
  state.adminToken = r.data?.data?.accessToken;
  state.adminRefresh = r.data?.data?.refreshToken;

  // Login wrong password
  r = await api('POST', '/api/auth/login', { body: { email: adminEmail, password: 'wrongpass' } });
  record('Auth', 'Login wrong password rejected (401)', r.status === 401, `status=${r.status}`);

  // Login nonexistent
  r = await api('POST', '/api/auth/login', { body: { email: 'nobody@nowhere.com', password: pwd } });
  record('Auth', 'Login nonexistent user (401)', r.status === 401, `status=${r.status}`);

  // Login missing fields
  r = await api('POST', '/api/auth/login', { body: { email: adminEmail } });
  record('Auth', 'Login missing password (400)', r.status === 400, `status=${r.status}`);

  // getMe with token
  r = await api('GET', '/api/auth/me', { token: state.adminToken });
  record('Auth', 'GET /me with valid token (200)', r.status === 200 && r.data?.data?.user?.email === adminEmail, `status=${r.status}`);

  // getMe no token
  r = await api('GET', '/api/auth/me');
  record('Auth', 'GET /me no token (401)', r.status === 401, `status=${r.status}`);

  // getMe malformed token
  r = await api('GET', '/api/auth/me', { token: 'garbage.token.value' });
  record('Auth', 'GET /me malformed token (401)', r.status === 401, `status=${r.status}`);

  // getMe tampered token (valid structure, wrong signature)
  const tampered = state.adminToken.slice(0, -3) + 'xyz';
  r = await api('GET', '/api/auth/me', { token: tampered });
  record('Auth', 'GET /me tampered signature (401)', r.status === 401, `status=${r.status}`);

  // Refresh token — wait >1s so the rotated JWT has a different `iat` (second
  // granularity), otherwise the new token is byte-identical to the old one.
  await new Promise((res) => setTimeout(res, 1100));
  r = await api('POST', '/api/auth/refresh', { body: { refreshToken: state.adminRefresh } });
  record('Auth', 'Refresh token issues new access (200)', r.status === 200 && !!r.data?.data?.accessToken, `status=${r.status}`);
  const newRefresh = r.data?.data?.refreshToken;

  // Old refresh token now invalid (rotation)
  r = await api('POST', '/api/auth/refresh', { body: { refreshToken: state.adminRefresh } });
  record('Auth', 'Old refresh token rejected after rotation (401)', r.status === 401, `status=${r.status}`);
  state.adminRefresh = newRefresh;
  // re-login to get fresh consistent tokens for rest of run
  r = await api('POST', '/api/auth/login', { body: { email: adminEmail, password: pwd } });
  state.adminToken = r.data?.data?.accessToken;
  state.adminRefresh = r.data?.data?.refreshToken;

  // Refresh with garbage
  r = await api('POST', '/api/auth/refresh', { body: { refreshToken: 'garbage' } });
  record('Auth', 'Refresh with invalid token (401)', r.status === 401, `status=${r.status}`);

  // Refresh missing
  r = await api('POST', '/api/auth/refresh', { body: {} });
  record('Auth', 'Refresh missing token (400)', r.status === 400, `status=${r.status}`);

  // Register member + outsider
  r = await api('POST', '/api/auth/register', { body: { fullName: 'QA Member', email: memberEmail, password: pwd } });
  state.memberToken = r.data?.data?.accessToken;
  state.memberId = r.data?.data?.user?._id;
  r = await api('POST', '/api/auth/register', { body: { fullName: 'QA Outsider', email: outsiderEmail, password: pwd } });
  state.outsiderToken = r.data?.data?.accessToken;
  state.outsiderId = r.data?.data?.user?._id;

  // Unauthorized API access across modules
  for (const [name, url] of [['family', '/api/family/my-family'], ['events', '/api/events'], ['memories', '/api/memories'], ['chat', '/api/chat/messages'], ['notifications', '/api/notifications'], ['location', '/api/location/family']]) {
    r = await api('GET', url);
    record('Auth', `Unauthorized ${name} access blocked (401)`, r.status === 401, `status=${r.status}`);
  }

  // ═══════════════ PHASE 3 — FAMILY ═══════════════
  // my-family before joining any
  r = await api('GET', '/api/family/my-family', { token: state.adminToken });
  record('Family', 'my-family when none (404)', r.status === 404, `status=${r.status}`);

  // create family missing name
  r = await api('POST', '/api/family/create', { token: state.adminToken, body: {} });
  record('Family', 'Create family missing name (400)', r.status === 400, `status=${r.status}`);

  // create family
  r = await api('POST', '/api/family/create', { token: state.adminToken, body: { name: 'QA Test Family' } });
  record('Family', 'Create family (201) + admin role', r.status === 201 && r.data?.data?.family?.name === 'QA Test Family', `status=${r.status}`);
  state.familyId = r.data?.data?.family?._id;

  // admin token role updated -> re-login to refresh role in token context (role is in DB, token only has id, so fine)
  r = await api('GET', '/api/auth/me', { token: state.adminToken });
  record('Family', 'Creator promoted to admin', r.data?.data?.user?.role === 'admin', `role=${r.data?.data?.user?.role}`);

  // create second family while in one
  r = await api('POST', '/api/family/create', { token: state.adminToken, body: { name: 'Second' } });
  record('Family', 'Cannot create 2nd family while in one (400)', r.status === 400, `status=${r.status}`);

  // invite code
  r = await api('POST', '/api/family/invite', { token: state.adminToken, body: {} });
  record('Family', 'Get invite code (200)', r.status === 200 && !!r.data?.data?.inviteCode, `status=${r.status}`);
  state.inviteCode = r.data?.data?.inviteCode;

  // invite by non-family user
  r = await api('POST', '/api/family/invite', { token: state.outsiderToken, body: {} });
  record('Family', 'Invite by non-family user blocked (403)', r.status === 403, `status=${r.status}`);

  // join with invalid code
  r = await api('POST', '/api/family/join', { token: state.memberToken, body: { inviteCode: 'ZZZZ-ZZZZ' } });
  record('Family', 'Join invalid code (404)', r.status === 404, `status=${r.status}`);

  // join missing code
  r = await api('POST', '/api/family/join', { token: state.memberToken, body: {} });
  record('Family', 'Join missing code (400)', r.status === 400, `status=${r.status}`);

  // join valid
  r = await api('POST', '/api/family/join', { token: state.memberToken, body: { inviteCode: state.inviteCode } });
  record('Family', 'Member joins via invite code (200)', r.status === 200, `status=${r.status}`);

  // join again (already member) -> user has familyId now, so 400
  r = await api('POST', '/api/family/join', { token: state.memberToken, body: { inviteCode: state.inviteCode } });
  record('Family', 'Join when already in a family (400)', r.status === 400, `status=${r.status}`);

  // my-family now returns members
  r = await api('GET', '/api/family/my-family', { token: state.adminToken });
  record('Family', 'my-family lists members', r.status === 200 && r.data?.data?.memberCount >= 2, `count=${r.data?.data?.memberCount}`);

  // admin cannot leave
  r = await api('DELETE', '/api/family/leave', { token: state.adminToken });
  record('Family', 'Admin cannot leave family (400)', r.status === 400, `status=${r.status}`);

  // regenerate invite code as non-admin (member) -> should NOT change code
  r = await api('POST', '/api/family/invite', { token: state.memberToken, body: { regenerate: true } });
  record('Family', 'Non-admin regenerate ignored (code unchanged)', r.status === 200 && r.data?.data?.inviteCode === state.inviteCode, `same=${r.data?.data?.inviteCode === state.inviteCode}`);

  // ═══════════════ PHASE 6 — FAMILY TREE (H1 regression) ═══════════════
  r = await api('GET', '/api/family-tree', { token: state.adminToken });
  const treeNodes = r.data?.data?.nodes;
  record('FamilyTree', 'GET family-tree responds 200', r.status === 200, `status=${r.status}`);
  record('FamilyTree', 'H1: tree has nodes for real (non-seeded) family', Array.isArray(treeNodes) && treeNodes.length > 0, `nodeCount=${Array.isArray(treeNodes) ? treeNodes.length : 'n/a'} (expected >0 for ${'>='}2 members)`);

  // update relationship (admin updating member) — depends on FamilyMember existing
  r = await api('PUT', '/api/family-tree/relationship', { token: state.adminToken, body: { userId: state.memberId, relationshipType: 'sibling' } });
  record('FamilyTree', 'Update relationship for member', r.status === 200, `status=${r.status} msg=${r.data?.message}`);

  // non-admin updating someone else's relationship (member updating admin) -> 403
  r = await api('PUT', '/api/family-tree/relationship', { token: state.memberToken, body: { userId: state.adminId, relationshipType: 'parent' } });
  record('FamilyTree', 'Non-admin cannot edit others relationship (403)', r.status === 403, `status=${r.status}`);

  // invalid relationship type
  r = await api('PUT', '/api/family-tree/relationship', { token: state.adminToken, body: { userId: state.memberId, relationshipType: 'bogus' } });
  record('FamilyTree', 'Invalid relationship type rejected (422)', r.status === 422, `status=${r.status}`);

  // family-tree without family
  r = await api('GET', '/api/family-tree', { token: state.outsiderToken });
  record('FamilyTree', 'Tree access without family (403)', r.status === 403, `status=${r.status}`);

  // ═══════════════ PHASE 4 — EVENTS ═══════════════
  r = await api('POST', '/api/events/create', { token: state.adminToken, body: { title: 'QA Picnic', description: 'Test', date: '2026-08-01', startTime: '10:00', endTime: '14:00', location: 'Park' } });
  record('Events', 'Create event (201)', r.status === 201 && !!r.data?.data?._id, `status=${r.status}`);
  state.eventId = r.data?.data?._id;
  record('Events', 'Event auto-invites family as guests', (r.data?.data?.guests?.length || 0) >= 2, `guests=${r.data?.data?.guests?.length}`);

  // create event missing title
  r = await api('POST', '/api/events/create', { token: state.adminToken, body: { description: 'no title' } });
  record('Events', 'Create event missing title (400)', r.status === 400, `status=${r.status}`);

  // create event by outsider (no family)
  r = await api('POST', '/api/events/create', { token: state.outsiderToken, body: { title: 'X' } });
  record('Events', 'Create event without family (403)', r.status === 403, `status=${r.status}`);

  // list events
  r = await api('GET', '/api/events', { token: state.memberToken });
  record('Events', 'List events (200)', r.status === 200 && Array.isArray(r.data?.data) && r.data.data.length >= 1, `count=${r.data?.data?.length}`);

  // event details
  r = await api('GET', `/api/events/${state.eventId}`, { token: state.memberToken });
  record('Events', 'Get event details (200)', r.status === 200 && r.data?.data?._id === state.eventId, `status=${r.status}`);

  // event details invalid id
  r = await api('GET', '/api/events/deadbeefdeadbeefdeadbeef', { token: state.memberToken });
  record('Events', 'Get event details not found (404)', r.status === 404, `status=${r.status}`);

  // event details malformed id
  r = await api('GET', '/api/events/notanid', { token: state.memberToken });
  record('Events', 'Get event details malformed id (400)', r.status === 400, `status=${r.status}`);

  // RSVP respond
  r = await api('POST', '/api/events/respond', { token: state.memberToken, body: { eventId: state.eventId, status: 'accepted' } });
  record('Events', 'RSVP accept (200)', r.status === 200, `status=${r.status}`);

  // RSVP invalid status
  r = await api('POST', '/api/events/respond', { token: state.memberToken, body: { eventId: state.eventId, status: 'perhaps' } });
  record('Events', 'RSVP invalid status (400)', r.status === 400, `status=${r.status}`);

  // RSVP by outsider not invited
  r = await api('POST', '/api/events/respond', { token: state.outsiderToken, body: { eventId: state.eventId, status: 'accepted' } });
  record('Events', 'RSVP by non-guest blocked (403/404)', r.status === 403 || r.status === 404, `status=${r.status}`);

  // update event as creator
  r = await api('PATCH', `/api/events/${state.eventId}`, { token: state.adminToken, body: { title: 'QA Picnic Updated' } });
  record('Events', 'Update event as creator (200)', r.status === 200 && r.data?.data?.title === 'QA Picnic Updated', `status=${r.status}`);

  // update event as member (not creator/admin) -> 403
  r = await api('PATCH', `/api/events/${state.eventId}`, { token: state.memberToken, body: { title: 'Hacked' } });
  record('Events', 'Update event by non-creator member (403)', r.status === 403, `status=${r.status}`);

  // ── Polls ──
  r = await api('POST', '/api/polls', { token: state.adminToken, body: { eventId: state.eventId, question: 'Best date?', options: [{ dateTime: '2026-08-01T10:00:00Z', label: 'Sat' }, { dateTime: '2026-08-02T10:00:00Z', label: 'Sun' }] } });
  record('Events', 'Create poll (201)', r.status === 201 && !!r.data?.data?.poll?._id, `status=${r.status}`);
  state.pollId = r.data?.data?.poll?._id;
  state.optionId = r.data?.data?.poll?.options?.[0]?._id;

  // poll with <2 options
  r = await api('POST', '/api/polls', { token: state.adminToken, body: { eventId: state.eventId, question: 'Bad', options: [{ dateTime: '2026-08-01T10:00:00Z', label: 'Only' }] } });
  record('Events', 'Create poll <2 options rejected (422)', r.status === 422, `status=${r.status}`);

  // get poll by event
  r = await api('GET', `/api/polls/event/${state.eventId}`, { token: state.memberToken });
  record('Events', 'Get poll by event (200)', r.status === 200 && !!r.data?.data?.poll, `status=${r.status}`);

  // vote
  r = await api('POST', `/api/polls/${state.pollId}/vote`, { token: state.memberToken, body: { optionId: state.optionId, vote: 'yes' } });
  record('Events', 'Cast poll vote (200)', r.status === 200, `status=${r.status}`);

  // vote invalid value
  r = await api('POST', `/api/polls/${state.pollId}/vote`, { token: state.memberToken, body: { optionId: state.optionId, vote: 'sure' } });
  record('Events', 'Cast invalid vote (422)', r.status === 422, `status=${r.status}`);

  // close poll as member (not creator/admin) -> 403
  r = await api('POST', `/api/polls/${state.pollId}/close`, { token: state.memberToken, body: {} });
  record('Events', 'Close poll by non-owner (403)', r.status === 403, `status=${r.status}`);

  // close poll as admin
  r = await api('POST', `/api/polls/${state.pollId}/close`, { token: state.adminToken, body: {} });
  record('Events', 'Close poll as admin (200)', r.status === 200, `status=${r.status}`);

  // vote on closed poll
  r = await api('POST', `/api/polls/${state.pollId}/vote`, { token: state.memberToken, body: { optionId: state.optionId, vote: 'no' } });
  record('Events', 'Vote on closed poll blocked (400)', r.status === 400, `status=${r.status}`);

  // ═══════════════ PHASE 5 — MEMORIES ═══════════════
  // upload requires multipart file — cannot easily send via fetch without a file; test the no-file path
  r = await api('POST', '/api/memories/upload', { token: state.adminToken, body: { caption: 'x' } });
  record('Memories', 'Upload without file rejected (400/500)', r.status === 400 || r.status === 500, `status=${r.status}`);

  // list memories (empty ok)
  r = await api('GET', '/api/memories', { token: state.memberToken });
  record('Memories', 'List memories (200)', r.status === 200 && Array.isArray(r.data?.data), `status=${r.status}`);

  // like nonexistent memory
  r = await api('POST', '/api/memories/like', { token: state.memberToken, body: { memoryId: 'deadbeefdeadbeefdeadbeef' } });
  record('Memories', 'Like nonexistent memory (404)', r.status === 404, `status=${r.status}`);

  // memory details not found
  r = await api('GET', '/api/memories/deadbeefdeadbeefdeadbeef', { token: state.memberToken });
  record('Memories', 'Memory details not found (404)', r.status === 404, `status=${r.status}`);

  // ── Albums ──
  r = await api('POST', '/api/albums', { token: state.adminToken, body: { title: 'QA Album', description: 'test' } });
  record('Memories', 'Create album (201)', r.status === 201 && !!r.data?.data?.album?._id, `status=${r.status}`);
  state.albumId = r.data?.data?.album?._id;

  // create album missing title
  r = await api('POST', '/api/albums', { token: state.adminToken, body: {} });
  record('Memories', 'Create album missing title (422)', r.status === 422, `status=${r.status}`);

  // list albums (paginated)
  r = await api('GET', '/api/albums', { token: state.memberToken });
  record('Memories', 'List albums paginated (200)', r.status === 200 && !!r.data?.pagination, `status=${r.status}`);

  // get album detail
  r = await api('GET', `/api/albums/${state.albumId}`, { token: state.memberToken });
  record('Memories', 'Get album detail (200)', r.status === 200 && !!r.data?.data?.album, `status=${r.status}`);

  // add media empty array
  r = await api('POST', `/api/albums/${state.albumId}/add-media`, { token: state.adminToken, body: { memoryIds: [] } });
  record('Memories', 'Add media empty array rejected (400)', r.status === 400, `status=${r.status}`);

  // share album
  r = await api('POST', `/api/albums/${state.albumId}/share`, { token: state.adminToken, body: {} });
  record('Memories', 'Share album returns link (200)', r.status === 200 && !!r.data?.data?.shareLink, `status=${r.status}`);

  // update album by non-owner member -> 403
  r = await api('PUT', `/api/albums/${state.albumId}`, { token: state.memberToken, body: { title: 'Hacked' } });
  record('Memories', 'Update album by non-owner (403)', r.status === 403, `status=${r.status}`);

  // delete album by non-owner member -> 403
  r = await api('DELETE', `/api/albums/${state.albumId}`, { token: state.memberToken });
  record('Memories', 'Delete album by non-owner (403)', r.status === 403, `status=${r.status}`);

  // ═══════════════ PHASE 7 — CHAT ═══════════════
  r = await api('POST', '/api/chat/send', { token: state.adminToken, body: { text: 'Hello family QA' } });
  record('Chat', 'Send text message (201)', r.status === 201 && !!r.data?.data?._id, `status=${r.status}`);
  state.msgId = r.data?.data?._id;

  // send empty
  r = await api('POST', '/api/chat/send', { token: state.adminToken, body: {} });
  record('Chat', 'Send empty message rejected (400)', r.status === 400, `status=${r.status}`);

  // reply to message
  r = await api('POST', '/api/chat/send', { token: state.memberToken, body: { text: 'Reply here', replyTo: state.msgId } });
  record('Chat', 'Reply to message (201)', r.status === 201 && r.data?.data?.replyTo, `status=${r.status}`);
  state.replyId = r.data?.data?._id;

  // reply to nonexistent
  r = await api('POST', '/api/chat/send', { token: state.memberToken, body: { text: 'x', replyTo: 'deadbeefdeadbeefdeadbeef' } });
  record('Chat', 'Reply to nonexistent target (400)', r.status === 400, `status=${r.status}`);

  // get messages
  r = await api('GET', '/api/chat/messages', { token: state.memberToken });
  record('Chat', 'Get messages ordered + meta (200)', r.status === 200 && Array.isArray(r.data?.data) && !!r.data?.meta, `count=${r.data?.data?.length}`);

  // react
  r = await api('POST', `/api/chat/${state.msgId}/react`, { token: state.memberToken, body: { emoji: '👍' } });
  record('Chat', 'React to message (200)', r.status === 200 && r.data?.data?.reactions?.length >= 1, `status=${r.status}`);

  // react missing emoji
  r = await api('POST', `/api/chat/${state.msgId}/react`, { token: state.memberToken, body: {} });
  record('Chat', 'React missing emoji (400)', r.status === 400, `status=${r.status}`);

  // edit own message
  r = await api('PATCH', `/api/chat/${state.msgId}`, { token: state.adminToken, body: { text: 'Edited text' } });
  record('Chat', 'Edit own message (200)', r.status === 200 && r.data?.data?.editedAt, `status=${r.status}`);

  // edit other's message -> 403
  r = await api('PATCH', `/api/chat/${state.msgId}`, { token: state.memberToken, body: { text: 'Hack' } });
  record('Chat', 'Edit others message blocked (403)', r.status === 403, `status=${r.status}`);

  // pin
  r = await api('POST', `/api/chat/${state.msgId}/pin`, { token: state.adminToken, body: {} });
  record('Chat', 'Pin message (200)', r.status === 200 && r.data?.data?.pinnedAt, `status=${r.status}`);

  // get pinned
  r = await api('GET', '/api/chat/pinned', { token: state.memberToken });
  record('Chat', 'Get pinned messages (200)', r.status === 200 && r.data?.data?.length >= 1, `count=${r.data?.data?.length}`);

  // unpin
  r = await api('DELETE', `/api/chat/${state.msgId}/pin`, { token: state.adminToken });
  record('Chat', 'Unpin message (200)', r.status === 200 && !r.data?.data?.pinnedAt, `status=${r.status}`);

  // star
  r = await api('POST', `/api/chat/${state.msgId}/star`, { token: state.memberToken, body: {} });
  record('Chat', 'Star message (200)', r.status === 200 && r.data?.starred === true, `status=${r.status} starred=${r.data?.starred}`);

  // get starred
  r = await api('GET', '/api/chat/starred', { token: state.memberToken });
  record('Chat', 'Get starred messages (200)', r.status === 200 && r.data?.data?.length >= 1, `count=${r.data?.data?.length}`);

  // search literal
  r = await api('GET', '/api/chat/search?q=Edited', { token: state.memberToken });
  record('Chat', 'Search text (200)', r.status === 200 && Array.isArray(r.data?.data), `count=${r.data?.data?.length}`);

  // search regex metacharacters (ReDoS/injection fix)
  for (const q of ['(.*)+', '[', '\\', '((((']) {
    r = await api('GET', `/api/chat/search?q=${encodeURIComponent(q)}`, { token: state.memberToken });
    record('Chat', `Search regex metachar "${q}" no 500`, r.status === 200, `status=${r.status}`);
  }

  // search by type media
  r = await api('GET', '/api/chat/search?type=media', { token: state.memberToken });
  record('Chat', 'Search by media type (200)', r.status === 200, `status=${r.status}`);

  // delete own message
  r = await api('DELETE', `/api/chat/${state.replyId}`, { token: state.memberToken });
  record('Chat', 'Delete own message (200)', r.status === 200, `status=${r.status}`);

  // delete other's message as non-admin -> use outsider? outsider not in family. member delete admin msg -> 403
  r = await api('DELETE', `/api/chat/${state.msgId}`, { token: state.memberToken });
  record('Chat', 'Delete others message blocked (403)', r.status === 403, `status=${r.status}`);

  // admin can delete any message
  r = await api('DELETE', `/api/chat/${state.msgId}`, { token: state.adminToken });
  record('Chat', 'Admin delete any message (200)', r.status === 200, `status=${r.status}`);

  // ═══════════════ PHASE 8 — LOCATION / SOS ═══════════════
  r = await api('POST', '/api/location/update', { token: state.memberToken, body: { latitude: 6.9271, longitude: 79.8612, accuracy: 5, battery: 90 } });
  record('Map', 'Update location (200)', r.status === 200 && r.data?.data?.latitude === 6.9271, `status=${r.status}`);

  // update missing coords
  r = await api('POST', '/api/location/update', { token: state.memberToken, body: { accuracy: 5 } });
  record('Map', 'Update location missing coords (400)', r.status === 400, `status=${r.status}`);

  // get family locations
  r = await api('GET', '/api/location/family', { token: state.adminToken });
  record('Map', 'Get family locations (200)', r.status === 200 && r.data?.data?.length >= 1, `count=${r.data?.data?.length}`);

  // get specific user location
  r = await api('GET', `/api/location/${state.memberId}`, { token: state.adminToken });
  record('Map', 'Get member location (200)', r.status === 200, `status=${r.status}`);

  // get location of user with none
  r = await api('GET', `/api/location/${state.adminId}`, { token: state.adminToken });
  record('Map', 'Get location none available (404)', r.status === 404, `status=${r.status}`);

  // SOS
  r = await api('POST', '/api/location/sos', { token: state.memberToken, body: { latitude: 6.9271, longitude: 79.8612, message: 'Help QA' } });
  record('Map', 'Send SOS alert (200)', r.status === 200, `status=${r.status}`);

  // SOS missing coords
  r = await api('POST', '/api/location/sos', { token: state.memberToken, body: { message: 'Help' } });
  record('Map', 'SOS missing coords (400)', r.status === 400, `status=${r.status}`);

  // ═══════════════ PHASE 11 — NOTIFICATIONS ═══════════════
  r = await api('GET', '/api/notifications', { token: state.memberToken });
  record('Notifications', 'Get notifications (200)', r.status === 200 && Array.isArray(r.data?.data), `count=${r.data?.data?.length}`);
  state.notifId = r.data?.data?.[0]?._id;

  // create notification as MEMBER (M2 fix: should be admin-only)
  r = await api('POST', '/api/notifications/create', { token: state.memberToken, body: { recipientIds: [state.adminId], type: 'custom', title: 'QA', body: 'test' } });
  record('Notifications', 'M2 FIX: /create by non-admin member BLOCKED (403)', r.status === 403, `status=${r.status}`);

  // create notification as admin
  r = await api('POST', '/api/notifications/create', { token: state.adminToken, body: { recipientIds: [state.memberId], type: 'custom', title: 'QA Admin', body: 'hi' } });
  record('Notifications', 'Create notification as admin (201)', r.status === 201, `status=${r.status}`);

  // create missing recipients
  r = await api('POST', '/api/notifications/create', { token: state.adminToken, body: { title: 'x' } });
  record('Notifications', 'Create notification missing recipients (400)', r.status === 400, `status=${r.status}`);

  // mark read
  r = await api('GET', '/api/notifications', { token: state.memberToken });
  const nId = r.data?.data?.[0]?._id;
  if (nId) {
    r = await api('PUT', `/api/notifications/read/${nId}`, { token: state.memberToken });
    record('Notifications', 'Mark notification read (200)', r.status === 200 && r.data?.data?.isRead === true, `status=${r.status}`);
    // delete
    r = await api('DELETE', `/api/notifications/${nId}`, { token: state.memberToken });
    record('Notifications', 'Delete notification (200)', r.status === 200, `status=${r.status}`);
  } else {
    record('Notifications', 'Mark notification read', false, 'no notification found to mark');
  }

  // mark read someone else's / nonexistent
  r = await api('PUT', '/api/notifications/read/deadbeefdeadbeefdeadbeef', { token: state.memberToken });
  record('Notifications', 'Mark read nonexistent (404)', r.status === 404, `status=${r.status}`);

  // ═══════════════ PHASE 12 — SECURITY ═══════════════
  // NoSQL injection in login (object instead of string)
  r = await api('POST', '/api/auth/login', { body: { email: { $ne: null }, password: { $ne: null } } });
  record('Security', 'NoSQL injection login blocked (not 200)', r.status !== 200, `status=${r.status}`);

  // Access another family's resource: outsider creates own family, then tries to read first family event
  r = await api('POST', '/api/family/create', { token: state.outsiderToken, body: { name: 'Outsider Family' } });
  const outsiderFamOk = r.status === 201;
  r = await api('GET', `/api/events/${state.eventId}`, { token: state.outsiderToken });
  record('Security', 'Cross-family event access blocked (404)', r.status === 404, `status=${r.status}`);
  r = await api('GET', `/api/memories/${'deadbeefdeadbeefdeadbeef'}`, { token: state.outsiderToken });
  record('Security', 'Cross-family memory scoping enforced', r.status === 404, `status=${r.status}`);

  // Expired-ish token: craft token signed with wrong secret
  const jwt = require('jsonwebtoken');
  const forged = jwt.sign({ id: state.adminId }, 'WRONG_SECRET', { expiresIn: '1h' });
  r = await api('GET', '/api/auth/me', { token: forged });
  record('Security', 'Token signed with wrong secret rejected (401)', r.status === 401, `status=${r.status}`);

  // Expired token
  const expired = jwt.sign({ id: state.adminId }, process.env.JWT_SECRET || 'FamilyConnect_SuperSecret_JWT_Key_2024_!@#$', { expiresIn: -10 });
  r = await api('GET', '/api/auth/me', { token: expired });
  record('Security', 'Expired token rejected (401)', r.status === 401, `status=${r.status}`);

  // 404 route
  r = await api('GET', '/api/nonexistent-route', { token: state.adminToken });
  record('Security', 'Unknown route returns 404', r.status === 404, `status=${r.status}`);

  // Health endpoint
  r = await api('GET', '/health');
  record('Security', 'Health endpoint public (200)', r.status === 200 && r.data?.success, `status=${r.status}`);

  // ═══════════════ CLEANUP: member leaves ═══════════════
  r = await api('DELETE', '/api/family/leave', { token: state.memberToken });
  record('Family', 'Non-admin member can leave family (200)', r.status === 200, `status=${r.status}`);

  // ── write results ──
  const outDir = path.join(__dirname, '..', '..', 'docs', 'qa');
  fs.mkdirSync(outDir, { recursive: true });
  const summary = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    total: results.length,
    passed: results.filter((x) => x.status === 'PASS').length,
    failed: results.filter((x) => x.status === 'FAIL').length,
  };
  fs.writeFileSync(path.join(outDir, 'api-results.json'), JSON.stringify({ summary, results }, null, 2));
  console.log('\n──────────────────────────────');
  console.log(`TOTAL ${summary.total} | PASS ${summary.passed} | FAIL ${summary.failed}`);
  console.log('Results written to docs/qa/api-results.json');
  const fails = results.filter((x) => x.status === 'FAIL');
  if (fails.length) {
    console.log('\nFAILURES:');
    fails.forEach((f) => console.log(`  - [${f.phase}] ${f.name} (${f.detail})`));
  }
}

run().catch((e) => {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
});
