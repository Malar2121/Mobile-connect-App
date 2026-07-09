# Family Connect — Bug Report (Final Testing Phase)

**Project:** Family Connect (monorepo: `backend/` Node/Express/MongoDB/Socket.io + `family-connect-mobile/` Expo RN)
**QA role:** Senior QA Engineer — full-system verification
**Test date:** 2026-07-09
**Method:** Live API testing against a running server + local MongoDB (automated harness, 122 REST cases), live Socket.io testing (7 cases), and code-verified static review of the mobile client (build, navigation, i18n, accessibility, offline, notifications, regressions). **Nothing was assumed to work — every backend endpoint was exercised with real requests.**

---

## Summary

| Severity | Found | Fixed | Remaining |
|----------|:----:|:----:|:--------:|
| Critical | 1 | 1 | 0 |
| High | 1 | 1 | 0 |
| Medium | 5 | 1 | 4 |
| Low | 4 | 0 | 4 |
| **Total** | **11** | **3** | **8** |

> The Critical/High counts reflect defects **found during this testing phase** and confirmed by live reproduction. Prior-audit fixes (chat/map refetch storms, gallery TDZ, SOS, regex ReDoS) were re-verified and are counted as regression PASS, not re-reported here.

All remaining defects are **non-blocking** for an FYP demo / internal beta. None are crash or boot blockers. Details and reproduction steps below.

---

## Fixed in this phase

### BUG-C1 (Critical → FIXED) — Family Tree empty for real (non-seeded) families
- **Module:** Backend / Family Tree
- **Description:** `FamilyMember` documents were only ever created by the demo seed script. `createFamily` and `joinFamilyByCode` never created them, so `GET /api/family-tree` returned `{ nodes: [] }` for every real family, and `PUT /api/family-tree/relationship` returned `404 Family member not found`. The entire Family Tree feature was non-functional outside seeded demo data.
- **Steps to reproduce (pre-fix):**
  1. Register a user, `POST /api/family/create`.
  2. Register a second user, `POST /api/family/join` with the invite code.
  3. `GET /api/family-tree` as either user.
- **Expected:** Nodes for both members returned.
- **Actual (pre-fix):** `nodes: []` (0 nodes); relationship update → 404.
- **Root cause:** Membership was tracked only in `Family.members[]` (User ObjectIds); the tree reads from the separate `FamilyMember` collection, which was never populated by the create/join flows.
- **Fix applied:** `backend/controllers/familyController.js` — create a `FamilyMember` record (upsert) on `createFamily` (role `admin`, `joinedVia: creator`) and on `joinFamilyByCode` (role `member`, `joinedVia: invite_code`); delete it on `leaveFamily`.
- **Verification:** Live re-test — `GET /api/family-tree` now returns `nodeCount=2`; `PUT /relationship` returns `200 Relationship updated`. (TC covering this now PASS.)
- **Status:** ✅ FIXED & VERIFIED.

### BUG-H2 (High → FIXED) — `POST /api/notifications/create` callable by any member
- **Module:** Backend / Notifications (security)
- **Description:** The manual notification/push endpoint was protected only by `protect` (any authenticated family member), allowing any member to broadcast in-app + FCM push notifications to the whole family — a spam / phishing-push vector.
- **Steps to reproduce (pre-fix):** As a non-admin member, `POST /api/notifications/create` with `{ recipientIds, type, title, body }` → `201 Created`.
- **Expected:** Non-admins blocked (403).
- **Actual (pre-fix):** `201` — notification created and push dispatched.
- **Root cause:** Missing role check in `createNotification`.
- **Fix applied:** `backend/controllers/notificationController.js` — reject with `403` unless `req.user.role === 'admin'`.
- **Verification:** Live re-test — non-admin now `403`; admin still `201`. PASS.
- **Status:** ✅ FIXED & VERIFIED.

### BUG-M1 (Medium → FIXED) — Chat "star" response flag always `false`
- **Module:** Backend / Chat
- **Description:** `POST /api/chat/:id/star` computed its returned `starred` boolean **after** populating `starredBy` with User documents. `String(userDoc)` never equals the raw user id, so the response `starred` field was always `false` on both star and unstar, misreporting the toggle result. (The persisted DB state and the populated `starredBy` array were correct, which is why the mobile client — which reads `starredBy` — was unaffected; the API contract field itself was wrong.)
- **Steps to reproduce:** Star a fresh message → response `starred:false` despite the star being saved.
- **Expected:** `starred:true` when a message becomes starred.
- **Actual (pre-fix):** `starred:false` always.
- **Root cause:** Boolean derived from populated documents instead of raw ids; computed post-populate.
- **Fix applied:** `backend/controllers/chatController.js` — compute `isNowStarred` from raw ids **before** populate and return it.
- **Verification:** Live re-test — star now returns `starred:true`. PASS.
- **Status:** ✅ FIXED & VERIFIED.

---

## Remaining defects (non-blocking)

### BUG-M2 (Medium) — Offline mutation retry queue is dead code
- **Module:** Mobile / Offline
- **Description:** `src/utils/offlineQueue.js` implements a full retry queue (`enqueueOfflineRequest`, `registerQueueProcessor`, `flushOfflineQueue`), but **no domain processor is ever registered and `enqueueOfflineRequest` is never called**. `NetworkContext` calls `flushOfflineQueue()` on reconnect, but with zero processors it is a no-op.
- **Steps to reproduce:** Enable airplane mode, attempt a mutating action (e.g. send chat message) → it fails immediately; on reconnect nothing is retried.
- **Expected (design intent):** Mutations queue and replay on reconnect.
- **Actual:** Mutations fail immediately; no retry.
- **Root cause:** Queue wiring incomplete (documented as a v1.1 item in `KNOWN_LIMITATIONS.md`).
- **Fix applied:** None (would require new feature wiring; out of scope for this fix-only phase).
- **Status:** ⛔ OPEN (known limitation).

### BUG-M3 (Medium → FIXED) — Leave-family navigated to a route not in the current stack
- **Module:** Mobile / Navigation
- **Description:** `FamilySettingsScreen` (registered inside the Family stack, nested under the Profile stack as `FamilyModule`) called `navigation.navigate('ProfileMain')`, but `ProfileMain` is registered in the **parent** Profile stack, not the Family stack. Every other cross-navigator jump in the codebase uses `getParent()`; this one relied on implicit navigate-bubbling, which is fragile.
- **Steps to reproduce:** Family settings → Leave family → confirm.
- **Expected:** Return to the Profile home screen.
- **Actual:** Relied on implicit bubbling; inconsistent with the rest of the app and fragile to navigator restructuring.
- **Fix applied:** `family-connect-mobile/src/screens/family/FamilySettingsScreen.js` — `(navigation.getParent() ?? navigation).navigate('ProfileMain')`.
- **Status:** ✅ FIXED (code review). Runtime device confirmation recommended.

### BUG-M4 (Medium) — Systemic i18n gap on feature screens
- **Module:** Mobile / Accessibility (i18n)
- **Description:** The i18n engine and three complete locale bundles (English, Tamil, Sinhala, ~158 keys each) exist and work, and Profile/Auth/Language/Map-SOS screens use `t()`. However, the main feature modules (Events, Memories, Chat, Map home screens) use **hardcoded English strings**, so switching to Tamil/Sinhala leaves most of the app in English.
- **Expected:** Feature screens render translated strings for TA/SI.
- **Actual:** Feature screens stay English.
- **Fix applied:** None (broad content change across many screens; out of scope for a surgical fix phase).
- **Status:** ⛔ OPEN (known limitation).

### BUG-M5 (Medium) — Release build not Google-Play-valid (debug-signed)
- **Module:** Build / Release
- **Description:** The managed Expo project has no production keystore and no EAS credentials, so `assembleRelease` / `bundleRelease` fall back to the debug keystore. The artifact is installable/sideloadable for testing but **cannot be submitted to Google Play**.
- **Fix applied:** None (requires a real keystore / EAS credentials — an owner/release action, not a code defect).
- **Status:** ⛔ OPEN (release blocker for production only; fine for FYP demo/beta sideload).

### BUG-L1 (Low) — Malformed ObjectId returns 500 instead of 400
- **Module:** Backend (systemic across controllers)
- **Description:** Endpoints that take an id param (e.g. `GET /api/events/:id`) wrap their logic in `try/catch` and return `500 { message }` on a Mongoose `CastError` from a malformed id (e.g. `/api/events/notanid`), instead of letting the central error handler map `CastError → 400`. A valid-format-but-nonexistent id correctly returns 404; only *malformed* ids hit this.
- **Steps to reproduce:** `GET /api/events/notanid` with a valid token → `500`.
- **Expected:** `400 Invalid id` (or 404).
- **Actual:** `500 Internal Server Error`.
- **Root cause:** Per-controller `catch` returns 500 for all errors, so `CastError` never reaches `errorHandler` (which already maps it to 400).
- **Impact:** Low — the mobile client only ever sends ids sourced from real records, so it is not triggered in normal use. Fixing broadly would require touching ~8 controllers (a refactor); deliberately not changed in this surgical phase.
- **Status:** ⛔ OPEN (low, non-blocking).

### BUG-L2 (Low) — Version mismatch `app.json` vs `package.json`
- **Module:** Build
- **Description:** `app.json` `version: "1.0.0"` while `family-connect-mobile/package.json` `version: "1.0.0-rc.3"`. The Android build uses `app.json`, so this is cosmetic/traceability only.
- **Status:** ⛔ OPEN (low).

### BUG-L3 (Low) — Dashboard has no dedicated empty state when a family exists but sections are empty
- **Module:** Mobile / Dashboard
- **Description:** `EmptyDashboard` renders only when the user has no family. A brand-new family with zero events/memories/messages shows empty section shells rather than a friendly empty state. Additionally, `useDashboardData` `Promise.all` fails the whole dashboard if events/memories fetch throws (locations/notifications/messages are individually `.catch`-guarded, events/memories are not).
- **Status:** ⛔ OPEN (low, cosmetic + minor resilience).

### BUG-L4 (Low) — Incremental accessibility-label coverage
- **Module:** Mobile / Accessibility
- **Description:** ~94 `accessibilityLabel`s across 69 files; primary CTAs, tab bar, SOS, and FABs are labeled, but many icon-only buttons and list rows are not. No formal VoiceOver/TalkBack audit completed. No a11y crashes.
- **Status:** ⛔ OPEN (low, known limitation).

---

## Not reproduced / verified-safe (highlights)

- **Authentication:** register/login/logout/refresh/rotation, invalid credentials, duplicate email, malformed/tampered/expired/wrong-secret tokens, unauthorized access to every module — all behave correctly (24 cases PASS).
- **Authorization / multi-tenant isolation:** cross-family access to events and memories is blocked (404, family-scoped); RBAC on event/album/poll/message mutations enforced; admin overrides work.
- **Injection:** NoSQL-operator login payload rejected; chat search with regex metacharacters (`(.*)+`, `[`, `\`, `((((`) returns literal matches with no 500 (ReDoS fix holds).
- **Realtime:** Socket.io JWT handshake accepts valid tokens, rejects missing/invalid tokens; messages, REST→socket broadcast, and typing indicators propagate to the family room.
- **Prior-audit regressions:** gallery TDZ, SOS countdown/send, chat refetch storm, map refetch storm, memory-like null guard — all still fixed (code-verified).
