# Family Connect — Backend Production Release Audit

**Scope:** `backend/` only (Node.js + Express + MongoDB/Mongoose + Socket.io + Cloudinary + Firebase FCM). Mobile client (`family-connect-mobile/`) explicitly excluded. `node_modules/` excluded.
**Method:** Every backend source file (47 files) was read in full. Findings are verified against the actual code — nothing was assumed to work.
**Date:** 2026-07-03

---

## 1. Executive Summary

- **No syntax errors, import errors, or crash-on-boot bugs** were found. `node --check` passes on all 47 source files.
- The backend is **broadly well-structured**: consistent async/await, centralized error handler, JWT auth middleware, family-scoped queries almost everywhere, rate limiting, helmet, refresh-token rotation, and Cloudinary upload constraints.
- The most important real defect is a **functional gap**: the **Family Tree feature is non-functional for real families** because `FamilyMember` documents are only ever created by the seed script — never by the live create/join flow.
- Several **security hardening gaps** exist (long-lived access tokens, CORS `*`+credentials fallback, plaintext refresh token storage, un-escaped search regex — now fixed, `/notifications/create` not admin-restricted).
- **No automated tests exist** (`npm test` → "No tests found").

**Bug count by severity:** Critical: 0 · High: 3 · Medium: 9 · Low: 8

---

## 2. Files Modified

| File | Reason |
|------|--------|
| `backend/controllers/chatController.js` | Escape user input before using it in a MongoDB `$regex` in `searchMessages` — fixes regex-injection / ReDoS and invalid-regex 500s. |
| `backend/services/notificationService.js` | Replace `console.log`/`console.error` debug output with the winston `logger` (production-appropriate logging). |
| `backend/socket/socketServer.js` | Route the two raw `console.error` calls through the winston `logger`. |

All changes are minimal and surgical; no business logic or feature behavior was altered (search still matches literal text). Everything else below is left as a **documented recommendation** rather than a code change, per audit constraints.

---

## 3. Phase 1 — Static Code Audit

### 3.1 Syntax / import / require errors
- **None.** `node --check` passes on every file. All `require()` targets resolve (`middleware/errorHandler`, `utils/logger`, all routes/controllers/models exist).

### 3.2 Dead / unused code
| Severity | Item | Detail |
|----------|------|--------|
| Low | `backend/services/jwtService.js` | Entire file is **dead code**. `generateAccessToken`/`generateRefreshToken`/`verifyRefreshToken` are re-implemented inline in `authController.js` and this module is never imported anywhere. |
| Low | `backend/utils/helpers.js` → `generateInviteCode`, `getInviteExpiry`, `sanitizeUser` | Unused. `familyController` uses its own `makeInviteCode` (crypto) and its own `sanitize`. Only `getPaginationOptions` is actually consumed (album controller). |
| Low | Duplicate invite-code generators | `helpers.generateInviteCode` (nanoid) vs `familyController.makeInviteCode` (crypto). Two implementations of the same concept. |
| Low | Duplicate sanitize helpers | `helpers.sanitizeUser` vs `authController.sanitize`. |
| Low | Two auth middleware modules | `middleware/auth.js` re-exports `protect`/`authorize` from `middleware/authMiddleware.js` and adds `requireFamily`. Not a bug (intentional back-compat shim) but a source of inconsistency — some routes import from `auth.js`, others from `authMiddleware.js`. |

### 3.3 Debug code / console statements
- `console.*` calls were present in `notificationService.js` (2) and `socketServer.js` (2 raw + a dev-gated `log` helper). **The 4 error/info calls are now converted to `logger`.** The dev-gated `log()` helper in `socketServer.js` (guarded by `NODE_ENV !== 'production'`) is intentional and was left in place.

### 3.4 Unhandled rejections / missing try-catch
| Severity | Item | Detail |
|----------|------|--------|
| Low | Fire-and-forget `notifyFamilyMembers(...)` | Called without `await` in `eventController`, `memoryController`, `chatController`, `socketServer`. The function has an internal `try/catch`, so a rejection cannot escape — acceptable, but errors are swallowed silently (now at least logged). |
| Low | `process.on('unhandledRejection')` | Logs but does not exit or track the promise. No `uncaughtException` handler at all. |
| — | REST handlers | Every REST controller either wraps logic in `try/catch` or uses `asyncHandler` (poll/album/family-tree). No unguarded async route handlers found. |

### 3.5 Socket leaks / rooms
- Socket listeners (`send_message`, `typing`, `stop_typing`, `mark_read`, `disconnect`) are registered **inside** `io.on('connection')`, so they are per-socket and cleaned up automatically by Socket.io on disconnect. **No manual listener leak.**
- Rooms: each socket joins `family_<id>` on connect; Socket.io removes the socket from all rooms on disconnect. No explicit `leave` needed. **No room leak.**

### 3.6 Hardcoded strings / magic numbers
| Severity | Item | Detail |
|----------|------|--------|
| Low | Magic numbers | Chat message fetch cap `200`/default `100`, search limit `80`, notifications limit `50`, bcrypt salt rounds `12`, auth rate-limit `20`. Reasonable but not centralized as named constants. |
| Low | Hardcoded fallback URLs | `http://localhost:3000` in `familyController.inviteMember`; `process.env.CLIENT_URL` used unguarded in `albumController.shareAlbum` (would produce `undefined/shared-album/...` if unset). |

### 3.7 Secrets
- **No committed secrets.** `.env` is git-ignored; `.env.example` contains only placeholders. (Repo is not currently a git repository at all.)

---

## 4. Phase 3 — API Verification

Legend: **Auth** = `protect` present · **Fam** = family scoping (`req.user.familyId` in query) · **RBAC** = role/owner check · **Val** = explicit input validation.

### 4.1 Auth — `/api/auth`
| Method | Path | Registered | Controller | Auth | Fam | RBAC | Val | Notes |
|--------|------|-----------|-----------|------|-----|------|-----|-------|
| POST | `/register` | ✅ | `registerUser` | public | n/a | n/a | manual | OK |
| POST | `/login` | ✅ | `loginUser` | public | n/a | n/a | manual | OK, generic error message (no user enumeration) |
| POST | `/refresh` | ✅ | `refreshToken` | public | n/a | n/a | manual | Rotates refresh token, verifies stored token match |
| POST | `/logout` | ✅ | `logoutUser` | ✅ | n/a | n/a | n/a | Clears stored refresh token |
| GET | `/me` | ✅ | `getMe` | ✅ | n/a | n/a | n/a | OK |

### 4.2 Family — `/api/family`
| Method | Path | Registered | Controller | Auth | Fam | RBAC | Val | Notes |
|--------|------|-----------|-----------|------|-----|------|-----|-------|
| POST | `/create` | ✅ | `createFamily` | ✅ | n/a | promotes to admin | manual | OK |
| GET | `/my-family` | ✅ | `getMyFamily` | ✅ | ✅ | n/a | n/a | OK |
| POST | `/join` | ✅ | `joinFamilyByCode` | ✅ | ✅ | n/a | manual | OK |
| POST | `/invite` | ✅ | `inviteMember` | ✅ | ✅ | admin for regen only | n/a | OK |
| DELETE | `/leave` | ✅ | `leaveFamily` | ✅ | ✅ | blocks admin | n/a | OK |

### 4.3 Events — `/api/events`
| Method | Path | Registered | Controller | Auth | Fam | RBAC | Val | Notes |
|--------|------|-----------|-----------|------|-----|------|-----|-------|
| POST | `/create` | ✅ | `createEvent` | ✅ | ✅ | n/a | manual (title) | OK |
| GET | `/` | ✅ | `getFamilyEvents` | ✅ | ✅ | n/a | n/a | **Unbounded query** (no pagination) |
| POST | `/respond` | ✅ | `respondToEvent` | ✅ | ✅ | guest check | manual | OK |
| GET | `/:id` | ✅ | `getEventDetails` | ✅ | ✅ | n/a | n/a | OK |
| PATCH | `/:id` | ✅ | `updateEvent` | ✅ | ✅ | creator/admin | n/a | OK |
| DELETE | `/:id` | ✅ | `deleteEvent` | ✅ | ✅ | creator/admin | n/a | OK |

### 4.4 Polls — `/api/polls`
| Method | Path | Registered | Controller | Auth | Fam | RBAC | Val | Notes |
|--------|------|-----------|-----------|------|-----|------|-----|-------|
| POST | `/` | ✅ | `createPoll` | ✅ | ✅ (`requireFamily`) | n/a | ✅ express-validator | OK |
| GET | `/event/:eventId` | ✅ | `getPollByEvent` | ✅ | ✅ | n/a | n/a | OK |
| GET | `/:pollId` | ✅ | `getPoll` | ✅ | ✅ | n/a | n/a | OK |
| POST | `/:pollId/vote` | ✅ | `castVote` | ✅ | ✅ | n/a | ✅ | OK |
| POST | `/:pollId/close` | ✅ | `closePoll` | ✅ | ✅ | creator/admin | manual | OK |

### 4.5 Memories — `/api/memories`
| Method | Path | Registered | Controller | Auth | Fam | RBAC | Val | Notes |
|--------|------|-----------|-----------|------|-----|------|-----|-------|
| POST | `/upload` | ✅ | `uploadMemory` | ✅ | ✅ | n/a | multer + manual | OK |
| GET | `/` | ✅ | `getFamilyMemories` | ✅ | ✅ | n/a | n/a | **Unbounded query** (no pagination) |
| POST | `/like` | ✅ | `likeMemory` | ✅ | ✅ | n/a | manual | OK |
| GET | `/:id` | ✅ | `getMemoryDetails` | ✅ | ✅ | n/a | n/a | OK |
| DELETE | `/:id` | ✅ | `deleteMemory` | ✅ | ✅ | uploader/admin | n/a | OK |

### 4.6 Albums — `/api/albums`
| Method | Path | Registered | Controller | Auth | Fam | RBAC | Val | Notes |
|--------|------|-----------|-----------|------|-----|------|-----|-------|
| POST | `/` | ✅ | `createAlbum` | ✅ | ✅ | n/a | ✅ | OK |
| GET | `/` | ✅ | `getAlbums` | ✅ | ✅ | n/a | n/a | Paginated ✅ |
| GET | `/:id` | ✅ | `getAlbum` | ✅ | ✅ | n/a | n/a | Paginated media ✅ |
| PUT | `/:id` | ✅ | `updateAlbum` | ✅ | ✅ | creator/admin | n/a | OK |
| POST | `/:id/add-media` | ✅ | `addMediaToAlbum` | ✅ | ✅ | n/a | manual | `mediaCount` can drift (only increments) |
| POST | `/:id/share` | ✅ | `shareAlbum` | ✅ | ✅ | n/a | n/a | Uses `CLIENT_URL` unguarded |
| DELETE | `/:id` | ✅ | `deleteAlbum` | ✅ | ✅ | creator/admin | n/a | OK |

### 4.7 Chat — `/api/chat`
| Method | Path | Registered | Controller | Auth | Fam | RBAC | Val | Notes |
|--------|------|-----------|-----------|------|-----|------|-----|-------|
| POST | `/send` | ✅ | `sendMessage` | ✅ | ✅ | n/a | manual | multer media, emits `new_message` |
| GET | `/messages` | ✅ | `getFamilyMessages` | ✅ | ✅ | n/a | n/a | Cursor pagination via `before` ✅ |
| GET | `/search` | ✅ | `searchMessages` | ✅ | ✅ | n/a | n/a | Regex now escaped (fixed) |
| GET | `/pinned` | ✅ | `getPinnedMessages` | ✅ | ✅ | n/a | n/a | OK |
| GET | `/starred` | ✅ | `getStarredMessages` | ✅ | ✅ | n/a | n/a | OK |
| PATCH | `/:id` | ✅ | `editMessage` | ✅ | ✅ | sender only | manual | OK |
| DELETE | `/:id` | ✅ | `deleteMessage` | ✅ | ✅ | sender/admin | n/a | OK |
| POST | `/:id/react` | ✅ | `reactToMessage` | ✅ | ✅ | n/a | manual | OK |
| POST | `/:id/pin` | ✅ | `pinMessage` | ✅ | ✅ | any member | n/a | Un-pins all others first (single pin) |
| DELETE | `/:id/pin` | ✅ | `unpinMessage` | ✅ | ✅ | any member | n/a | OK |
| POST | `/:id/star` | ✅ | `toggleStarMessage` | ✅ | ✅ | per-user | n/a | OK |

### 4.8 Notifications — `/api/notifications`
| Method | Path | Registered | Controller | Auth | Fam | RBAC | Val | Notes |
|--------|------|-----------|-----------|------|-----|------|-----|-------|
| GET | `/` | ✅ | `getNotifications` | ✅ | recipient-scoped | n/a | n/a | Limited to 50 ✅ |
| POST | `/create` | ✅ | `createNotification` | ✅ | ✅ | **none** | manual | Documented as "internal/admin" but **any authenticated member** can call it (see Sec 5) |
| PUT | `/read/:id` | ✅ | `markAsRead` | ✅ | recipient-scoped | owner | n/a | OK |
| DELETE | `/:id` | ✅ | `deleteNotification` | ✅ | recipient-scoped | owner | n/a | OK |

### 4.9 Family Tree — `/api/family-tree`
| Method | Path | Registered | Controller | Auth | Fam | RBAC | Val | Notes |
|--------|------|-----------|-----------|------|-----|------|-----|-------|
| GET | `/` | ✅ | `getFamilyTree` | ✅ | ✅ | n/a | n/a | **Returns `{ nodes }` only** — no `edges`. **Empty for real families** (see High-1) |
| PUT | `/relationship` | ✅ | `updateRelationship` | ✅ | ✅ | admin or self | ✅ | **Path mismatch vs docs** (docs say `PUT /`) |

### 4.10 Location — `/api/location`
| Method | Path | Registered | Controller | Auth | Fam | RBAC | Val | Notes |
|--------|------|-----------|-----------|------|-----|------|-----|-------|
| POST | `/update` | ✅ | `updateLocation` | ✅ | ✅ | n/a | manual | Upsert + emits `location_update` |
| POST | `/sos` | ✅ | `sendSOS` | ✅ | ✅ | n/a | manual | Emits `sos_alert` + push |
| GET | `/family` | ✅ | `getFamilyLocations` | ✅ | ✅ | n/a | n/a | OK (bounded by family size) |
| GET | `/:userId` | ✅ | `getUserLocation` | ✅ | ✅ | n/a | n/a | OK |

### 4.11 Docs vs. implementation mismatches
| Severity | Doc (`API_SUMMARY.md`) | Reality | Type |
|----------|------------------------|---------|------|
| High | Family Tree `PUT /` "Update tree nodes/edges" | Route is `PUT /relationship`; updates one member relationship | Path + semantics mismatch |
| Medium | Family Tree `GET /` "Full tree graph" | Returns `{ nodes }` only — **no edges** | Response shape mismatch |
| Low | Notifications `POST /create` "Create (internal/admin)" | No admin/authorize guard — any member can call | Authorization mismatch |
| Info | Docs omit chat `mediaType`/`replyTo` params & the `meta.hasMore` response field | Implemented but undocumented | Minor doc drift |

### 4.12 Socket.io events (`socket/socketServer.js`)
| Event | Direction | JWT auth | Family scoping | Cleanup | Notes |
|-------|-----------|----------|----------------|---------|-------|
| (handshake) | — | ✅ `io.use` verifies `JWT_SECRET` | joins `family_<id>` | auto on disconnect | OK |
| `send_message` | C→S | ✅ | uses `socket.user.familyId` | per-socket | OK; if user has no family, `Message` validation fails (caught) |
| `typing` / `stop_typing` | C→S→others | ✅ | room-scoped | per-socket | OK |
| `mark_read` | C→S | ✅ | **not scoped** — `Message.findById(messageId)` has no `familyId` filter | per-socket | Low: a user could mark-read a message from another family; broadcast still goes only to own room |
| `disconnect` | — | ✅ | — | auto | OK |

---

## 5. Phase 4 — Security Review

| Severity | Area | Finding | Recommendation |
|----------|------|---------|----------------|
| High | Access token lifetime | Access tokens live **30 days** (`JWT_EXPIRE=30d`), refresh **90 days**. Logout clears the stored refresh token, but the already-issued 30-day access token remains valid and is **not revocable** (middleware only checks signature + user existence/active). | Shorten access token to ~15m–1h; rely on refresh rotation. At minimum, `isActive`/deactivation already blocks access — good. |
| Medium | CORS | Both HTTP CORS and Socket.io fall back to `origin: '*'` **with `credentials: true`** when `CLIENT_URL` is unset. `*`+credentials is rejected by browsers and, if a permissive origin is echoed, is unsafe. | Require `CLIENT_URL` in production; never combine `*` with credentials. |
| Medium | Refresh token storage | Refresh tokens stored **in plaintext** in the `User.refreshToken` field. A DB read discloses usable long-lived tokens. | Store a hash (e.g. SHA-256) of the refresh token and compare hashes. |
| Medium | Regex injection / ReDoS | `chatController.searchMessages` passed raw `q` into `$regex`. Malicious input caused invalid-regex 500s or catastrophic backtracking. | **FIXED** — input is now escaped to a literal. |
| Medium | Missing authorization | `POST /api/notifications/create` lets **any** authenticated family member send in-app + FCM push to arbitrary family members with attacker-chosen title/body (spam/phishing vector). Documented as admin-only. | Add `authorize('admin', 'parent')` or restrict to internal use. |
| Medium | No env validation / secret fallbacks | No startup validation that `JWT_SECRET`, `JWT_REFRESH_SECRET`, Mongo creds exist. `resolveMongoUri` silently falls back to `mongodb://127.0.0.1:27017/family_connect`. If `JWT_SECRET` is unset, all logins 500. | Fail fast on boot if required secrets are missing. |
| Low | NoSQL injection | Query filters consistently use scalar values from `req.body`/`req.params` (`_id`, `familyId`, `email`). Mongoose casts `_id`/ObjectId fields, limiting operator-injection. `login` uses `User.findOne({ email })` with a raw value — if a non-string (object) were sent, operator injection is theoretically possible, but express `json` + schema typing make this low risk. | Optionally add `express-mongo-sanitize` and type-check `email`/`password` are strings. |
| Low | File upload validation | Multer + Cloudinary enforce `allowed_formats` and `fileSize` limits per upload type (avatar 5MB, memory/chat via `MAX_FILE_SIZE_MB`). Good. `mediaType` is derived from MIME, not trusted from body alone. | None required. |
| Low | Stored-input / XSS | Message/caption text stored raw. Backend is JSON API (no server-rendered HTML), so risk is deferred to clients. | Ensure mobile/web escape on render (out of backend scope). |
| Low | Error handler leakage | Stack traces only returned when `NODE_ENV === 'development'`; production returns message only. Good. However raw `error.message` (e.g. Mongoose internals) is returned on 500s in the try/catch controllers. | Acceptable; consider generic 500 messages in production. |
| Low | Sensitive data in logs | `morgan('combined')` logs full URLs (tokens are in headers/body, not query, so not logged). `db.js` masks the Mongo password in logs. Good. | None. |
| Info | Rate limiting | Global 100/15min on `/api/*`, plus 20/15min on login & register. Reasonable. No per-user limit on expensive endpoints (upload, notifications/create). | Consider tighter limits on upload/notify. |

---

## 6. Phase 5 — Performance Review

| Severity | Area | Finding | Recommendation |
|----------|------|---------|----------------|
| Medium | N+1 writes + push | `notificationService.notifyFamilyMembers` loops per user doing a separate `Notification.create` **and** a separate `sendPush` (one FCM multicast per user). Fires on every message/event/memory/SOS. | Use `Notification.insertMany` once, and a single `sendEachForMulticast` with all collected tokens. |
| Medium | N+1 writes | `notificationController.createNotification` has the same per-recipient loop of `create` + `sendPush`. | Same batching fix. |
| Medium | Unbounded queries | `getFamilyEvents` and `getFamilyMemories` fetch **all** documents for a family with no `limit`/pagination (memories also double-populate `uploadedBy` + `tags`). Grows without bound. | Add pagination (`getPaginationOptions` already exists and is used by albums). |
| Low | Missing indexes | No index on `Event.familyId`, `Memory.familyId`, `EventPoll.{event,family}`, `Notification.{recipient,createdAt}`. These are the primary query keys. (Message, Album, Location, Family are indexed.) | Add compound indexes: `Event {familyId, date}`, `Memory {familyId, createdAt}`, `Notification {recipient, createdAt}`, `EventPoll {event, family}`. |
| Low | Chat pin | `pinMessage` runs `updateMany` (clear all pins) + `findOneAndUpdate` + full re-populate on every pin. Fine at family scale. | None required. |
| Low | Data-model inconsistency (perf side-effect) | `Memory.album` is a free-form `String`. Uploads/seed store the **album name** ("Festivals"); `albumController` stores/queries the **album `_id` as string**. `getAlbum` matches on `_id` → memories filed by name won't appear, and queries can't use an index on a mixed field. | Normalize `Memory.album` to an ObjectId ref and migrate existing values. |
| — | Socket broadcast | Emits are room-scoped (`family_<id>`), not global. Efficient. | None. |

---

## 7. Full Bug List by Severity

### Critical — none
No syntax errors, no crash-on-boot bugs, no unhandled-exception crashes, no auth bypass found.

### High
| # | Bug | Location |
|---|-----|----------|
| H1 | **Family Tree non-functional for real families.** `FamilyMember` docs are created **only** by `scripts/seedDemoData.js`. `createFamily`/`joinFamilyByCode` add users to the embedded `Family.members` array but never create a `FamilyMember` record, so `getFamilyTree` returns an empty `nodes` list for any non-seeded family. | `controllers/familyController.js`, `controllers/familyTreeController.js` |
| H2 | **Long-lived, non-revocable access tokens (30d).** Logout/deactivation cannot invalidate an already-issued access token for its full 30-day life. | `controllers/authController.js`, `middleware/authMiddleware.js` |
| H3 | **API docs vs. implementation mismatch (Family Tree).** Docs advertise `PUT /` returning "nodes/edges"; implementation is `PUT /relationship` and `GET /` returns nodes only. Client integrations following the docs will 404 / miss edges. | `docs/API_SUMMARY.md`, `routes/familyTreeRoutes.js` |

### Medium
| # | Bug | Location |
|---|-----|----------|
| M1 | Regex injection / ReDoS in chat search. **FIXED.** | `controllers/chatController.js` |
| M2 | `POST /notifications/create` not restricted to admin despite docs — spam/phishing push vector. | `routes/notificationRoutes.js`, `controllers/notificationController.js` |
| M3 | CORS `*` + `credentials:true` fallback when `CLIENT_URL` unset. | `server.js` |
| M4 | Refresh tokens stored in plaintext in the DB. | `controllers/authController.js`, `models/User.js` |
| M5 | No startup validation of required secrets; silent Mongo localhost fallback. | `config/db.js`, `server.js` |
| M6 | N+1 in `notifyFamilyMembers` (per-user create + individual FCM sends). | `services/notificationService.js` |
| M7 | N+1 in `createNotification`. | `controllers/notificationController.js` |
| M8 | Unbounded queries: `getFamilyEvents`, `getFamilyMemories`. | `controllers/eventController.js`, `controllers/memoryController.js` |
| M9 | `Memory.album` mixed String semantics (name vs. `_id`) → seeded memories don't link to API-created albums. | `models/Memory.js`, `controllers/albumController.js` |

### Low
| # | Bug | Location |
|---|-----|----------|
| L1 | Dead code file `services/jwtService.js` (never imported; logic duplicated inline). | `services/jwtService.js` |
| L2 | Unused helpers `generateInviteCode`, `getInviteExpiry`, `sanitizeUser`. | `utils/helpers.js` |
| L3 | Missing indexes on primary query keys (Event/Memory/Notification/EventPoll). | respective models |
| L4 | Socket `mark_read` not family-scoped (`findById` w/o `familyId`). | `socket/socketServer.js` |
| L5 | `console.*` debug/error logging. **FIXED** (notificationService + socketServer). | (was) `services/notificationService.js`, `socket/socketServer.js` |
| L6 | Hardcoded fallback URLs / `CLIENT_URL` used unguarded in `shareAlbum`. | `controllers/familyController.js`, `controllers/albumController.js` |
| L7 | Album `mediaCount` drifts (increment-only; not decremented on unlink/delete-memory). | `controllers/albumController.js` |
| L8 | Magic numbers not centralized (limits, salt rounds). | multiple |

---

## 8. Verification Commands & Results

| Check | Command | Result |
|-------|---------|--------|
| Lint | `npm run lint` | **Not available** — no `lint` script and no ESLint config in `backend/package.json`. |
| Syntax | `node --check` on all 47 backend source files | **PASS** — `ALL_SYNTAX_OK` (0 errors). |
| Tests | `npm test` (`jest --coverage`) | **No tests found** — exit code 1 (`0 matches`, 49 files checked). No project test files exist. |
| Editor lints | IDE diagnostics on the 3 modified files | **No linter errors.** |

---

## 9. Production Readiness

**Score: 74 / 100** — Solid, secure-by-default core with clean structure and no crash/critical bugs; held back by one non-functional feature (family tree for real families), long-lived access tokens, a few authorization/CORS hardening gaps, N+1 notification writes, unbounded list queries, and a complete absence of automated tests.
