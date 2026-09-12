# API reference

Base URL: `<origin>/api`

Generated from the route definitions in `backend/routes/` and verified against
the integration suite. Every endpoint below exists and is exercised by tests
unless explicitly marked otherwise.

---

## Conventions

**Authentication.** Every route except `/auth/register`, `/auth/login`,
`/auth/refresh` and `/auth/2fa/login` requires a bearer token:

```
Authorization: Bearer <accessToken>
```

**Response envelope.**

```json
{ "success": true, "message": "...", "data": { } }
```

Errors return `{ "success": false, "message": "..." }`, often with a
machine-readable `code`. The app translates errors by `code` first and by HTTP
status second, so a Sinhala or Tamil reader never sees the English `message`.
Stack traces are included only when `NODE_ENV=development`.

**Family scoping.** Every family resource is queried against the caller's own
family. Another family's ids return `404`, never that family's data.

### Middleware guards

| Guard | Effect |
|---|---|
| `protect` | Valid JWT required; attaches `req.user` |
| `requireFamily` | Caller must belong to a family |
| `requireParentalConsent` | A `memberType: 'child'` account is blocked until a guardian approves — `403` with `CONSENT_PENDING` or `CONSENT_REJECTED` |
| `denyGuestWrites` | A `role: 'guest'` account may read but not write — `403` with `GUEST_READ_ONLY`. SOS is exempt |

The same consent and guest rules apply on the Socket.IO connection (see Chat).

### Status codes

| Code | Meaning |
|---|---|
| 200 / 201 | Success |
| 202 | Accepted — join request pending admin approval |
| 400 | Invalid input |
| 401 | Missing, invalid or expired token |
| 403 | Authenticated but not permitted (role, consent, family membership) |
| 404 | Not found, or not in your family |
| 409 | Conflict — duplicate email, invite or celebration; memory already reviewed |
| 410 | Gone — invitation expired, revoked or already used |
| 413 | Too large — file over `MAX_FILE_SIZE_MB` (`FILE_TOO_LARGE`) or family storage allowance used (`MEDIA_QUOTA_EXCEEDED`) |
| 422 | Schema validation failed |
| 429 | Rate limited (`RATE_LIMITED`) |

### Error codes

| Code | Returned when |
|---|---|
| `GUEST_READ_ONLY` | A guest attempts a write |
| `CONSENT_PENDING` / `CONSENT_REJECTED` | A child account has not been approved by a guardian |
| `RATE_LIMITED` | A rate limit was reached |
| `FILE_TOO_LARGE` | An uploaded file exceeds `MAX_FILE_SIZE_MB` |
| `MEDIA_QUOTA_EXCEEDED` | The family's photo and video allowance is used |
| `SELF_REVIEW` | A member tries to approve or reject their own upload |
| `MEMORY_REVIEW_FORBIDDEN` | A guest or child tries to review memories |
| `ALREADY_REVIEWED` | The memory was already approved or rejected |

Email invitations return their own codes for invalid, revoked, used, expired
and wrong-account tokens.

---

## Auth — `/api/auth`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/register` | — | Create an account. Accepts `fullName`, `email`, `password`, optional `memberType` (`adult`/`child`/`elder`), `dateOfBirth`. A new account **cannot** claim `admin` |
| POST | `/login` | — | Returns `accessToken` + `refreshToken`, or a 2FA challenge |
| POST | `/refresh` | — | Exchange a refresh token for a new access token |
| POST | `/2fa/login` | — | Complete login with a TOTP code |
| POST | `/logout` | ✓ | Invalidate the stored refresh token |
| GET | `/me` | ✓ | Current user |
| PATCH | `/me` | ✓ | Update `fullName`, `avatar`, `dateOfBirth`, `elderMode`, push preferences and token, and **`language`** (`en`, `si` or `ta`; other values are ignored). The language decides how this member's notifications and push messages are written |
| POST | `/2fa/setup` · `/2fa/verify` · `/2fa/disable` | ✓ | Manage TOTP |

## Family — `/api/family`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/create` | ✓ | Create a family; caller becomes admin |
| GET | `/my-family` | ✓ | Family with populated members |
| POST | `/join` | ✓ | Join by `inviteCode`. Returns `202` if the family requires approval |
| POST | `/invite` | ✓ | Get or regenerate the shareable invite code |
| DELETE | `/leave` | ✓ | Leave your family |
| PATCH | `/` | ✓ admin | Update family details |
| PUT | `/members/:id/role` | ✓ admin | Set role: `admin`, `parent`, `member`, `child`, `guest`. Refuses a change that would leave no admin |
| PUT | `/members/:id/type` | ✓ admin | Set `memberType`; switching to `child` opens a consent request |
| POST | `/members/:id/life-events` | ✓ | Add a life event to the family tree |
| POST/GET | `/join-requests` | ✓ | Request to join (**requires `inviteCode`**) / list pending (admin) |
| POST | `/join-requests/:id/approve` · `/reject` | ✓ admin | Decide a request |
| GET | `/history` | ✓ consent | The family history journal: `origins`, `traditions`, `culturalNotes`, `importantEvents`, `achievements`, `historicalMemories`, with who updated it and when |
| PUT | `/history` | ✓ consent, not guest | Update any of those fields (each up to 5,000 characters). One shared copy for the family |

### Email invitations — `/api/family/invitations`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/invitations` | ✓ admin/parent | Invite by `email`, optional `role` (`member`/`parent`/`guest` — **never `admin`**). Returns `emailSent`; when mail is unconfigured or fails it returns `emailSent: false`, a `deliveryReason`, and the raw `token` so the invite can still be shared |
| GET | `/invitations` | ✓ admin/parent | List this family's invitations |
| GET | `/invitations/verify/:token` | ✓ | Check a token; returns only the family name |
| POST | `/invitations/accept` | ✓ | Accept with `{ token }`. Single use, expiring (`INVITE_CODE_EXPIRY_HOURS`, default 48), bound to the invited email |
| DELETE | `/invitations/:id` | ✓ admin/parent | Revoke |

Only a SHA-256 hash of the token is stored.

## Events — `/api/events`

| Method | Path | Purpose |
|---|---|---|
| POST | `/create` | Create; accepts `title`, `date`, `startTime`, `endTime`, `location`, `image`, `reminders` (minutes before), `recurrenceRule`, `attachments` |
| GET | `/` | Family events |
| GET | `/notes?limit=` | The family's most recent event notes across all events, newest first (default 30, maximum 100) |
| GET/PATCH/DELETE | `/:id` | Read, update, delete |
| POST | `/respond` | RSVP: `accepted`, `declined`, `maybe` |
| GET/POST | `/:id/comments` | **Event notes** on one event — list and add |

`recurrenceRule` is stored but not expanded into repeated events.

## Availability polls — `/api/polls`

All routes require a family and parental consent; guests may read but not
create, vote or close.

| Method | Path | Purpose |
|---|---|---|
| POST | `/` | Create a poll for an event in your family: `eventId`, `question`, at least two `options` (`dateTime`, optional `label`), optional `deadline` |
| GET | `/event/:eventId` · `/:pollId` | Read, with `results`, `suggestion` and `suggestionReason` |
| POST | `/:pollId/vote` | `{ optionId, vote }` with `yes`, `maybe` or `no`. Voting again on an option replaces your earlier vote. Returns the updated results and suggestion. A closed poll, or one past its deadline, returns `400` |
| POST | `/:pollId/close` | Creator or admin only. Optional `selectedOptionId` records the chosen date |

**Smart Date Suggestion** ranks options by fewest blockers, then availability,
then coverage, then earliest date. Availability is measured against the whole
family, not only those who replied, and `maybe` counts as half. Past options
are never suggested; with no votes the response says `no_responses_yet` rather
than inventing a winner. Reasons: `no_responses_yet`,
`works_for_everyone_who_replied`, `best_available_with_conflicts`,
`all_options_past`, `no_options`. Confidence: `high`, `medium`, `low`, `none`.

## Celebrations — `/api/celebrations`

| Method | Path | Purpose |
|---|---|---|
| GET | `/?days=365` | Upcoming, sorted by proximity. Includes **virtual birthdays** derived from members' `dateOfBirth` |
| POST | `/` | Create `anniversary`, `cultural` or `other`. `birthday` is rejected — birthdays come from profiles |
| GET/PUT/DELETE | `/:id` | Read, update, delete (creator or admin) |

## Memories — `/api/memories`

All routes require parental consent; guests may read but not upload, review or
delete.

| Method | Path | Purpose |
|---|---|---|
| POST | `/upload` | Multipart `media` (image or video, up to `MAX_FILE_SIZE_MB`) with `caption`. Refused with `413 MEDIA_QUOTA_EXCEEDED` before anything is sent to Cloudinary if the family allowance (`FAMILY_MEDIA_QUOTA_MB`) would be exceeded. The new memory is `pending` until another member approves it, or `approved` at once when nobody else could review it |
| GET | `/` · `/:id` | Approved memories, plus your own pending or rejected uploads. A member who can review may open a pending memory |
| GET | `/pending` | Memories waiting for review. Guests and children get `403 MEMORY_REVIEW_FORBIDDEN` |
| GET | `/usage` | Storage the family has used against its allowance |
| POST | `/:id/approve` · `/:id/reject` | Review a pending memory; `reject` accepts an optional `reason` (up to 300 characters). Your own upload returns `403 SELF_REVIEW`; a decided memory returns `409 ALREADY_REVIEWED`. The uploader is notified either way |
| POST | `/like` | Toggle like |
| GET/POST | `/:id/comments` | Notes on a memory |
| DELETE | `/:id` | Delete |

**Who reviews.** Any member of the family who is not the uploader, not a guest
and not a child. Proposal §8: "Members approve shared photos and videos."

## Stories — `/api/stories`

Written family stories, alongside photos and videos (proposal Objective 4).
Consent-gated; guests read only.

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | The family's stories with their authors |
| POST | `/` | `title` (up to 120 characters), `body` (up to 5,000), optional `category`: `story`, `tradition`, `origin`, `milestone` or `recipe`. May link an event in the same family |
| GET | `/:id` | One story |
| PUT / DELETE | `/:id` | The author or an admin only; others get `403` |

Sinhala and Tamil text is stored exactly as written.

## Albums — `/api/albums`

`POST /` · `GET /` · `GET /:id` · `PUT /:id` · `POST /:id/add-media` ·
`POST /:id/share` · `DELETE /:id` — paginated with `page` and `limit`.

## Chat — `/api/chat`

All routes require parental consent; guests may read but not send, edit, react
or pin.

| Method | Path | Purpose |
|---|---|---|
| POST | `/send` | Send `text` and/or a multipart `media` file: image, video, audio or document (PDF, DOC, DOCX), up to `MAX_FILE_SIZE_MB`. A larger file returns `413 FILE_TOO_LARGE`. `@Full Name` is resolved server-side into `mentions`; each person named gets a `chat_mention` notification instead of the ordinary `chat_message` one |
| GET | `/messages?limit=&before=` | History, newest last, capped at 200, with `meta.hasMore` |
| GET | `/search` · `/pinned` · `/starred` | Query views |
| PATCH | `/:id` | Edit your own message. Mentions are re-resolved, and only people newly mentioned by the edit are notified |
| DELETE | `/:id` | Delete your own message |
| POST | `/:id/react` · `/:id/star` · `/:id/pin` · DELETE `/:id/pin` | Reactions, stars, pinning |

### Socket.IO

The connection authenticates with the JWT in `handshake.auth.token`. A member
joins the room `family_<familyId>` only while they may read family content, and
the server re-checks access on every action:

| Client event | Requires |
|---|---|
| `send_message` | Write access (not a guest; consent approved) |
| `typing` · `stop_typing` | Write access |
| `mark_read` | Read access |

When a member's access changes (for example a guardian approves a child, or an
admin changes a role) the server moves their sockets in or out of the family
room and emits `family_access` with `canRead`, `canWrite` and `code`.

Server events: `new_message`, `message_updated`, `message_deleted`, `typing`,
`stop_typing`, `message_read`, `family_access`, `location_update`,
`location_sharing_changed`, `member_type_changed`, `sos_alert`,
`safezones_changed`, `zone_alert`.

## Parental consent — `/api/consent`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/me` | ✓ | Own consent status — reachable **while blocked**, so the app can explain why |
| GET | `/pending` | ✓ guardian | Pending child accounts |
| POST | `/:id/approve` · `/:id/reject` | ✓ guardian | Decide. A minor cannot decide their own; another family's admin gets `404` |

## Family tree — `/api/family-tree`

`GET /` returns nodes. `PUT /relationship` updates a relationship (admin, or the
member themselves).

## Location and safety

`/api/location`: `POST /update`, `POST /sos`, `POST /sharing`, `GET /family`,
`GET /history/:userId`, `GET /:userId`. Children and elders cannot disable
sharing. **SOS is available to every role**, including guests and unapproved
minors.

`/api/safezones`: `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` — admins and
parents manage; all members read.

## Notifications — `/api/notifications`

`GET /`, `POST /create` (admin), `PUT /read/:id`, `POST /register-device`,
`DELETE /:id`.

Types: `chat_message`, `chat_mention`, `event_created`, `event_comment`,
`event_reminder`, `celebration_reminder`, `birthday_reminder`,
`consent_requested`, `consent_approved`, `consent_rejected`,
`memory_uploaded`, `memory_review_requested`, `memory_approved`,
`memory_rejected`, `memory_comment`, `story_created`, `legacy_created`,
`legacy_tribute`, `geofence_alert`, `sos_alert`.

The title and body are written in the **recipient's** language (`User.language`),
in the stored notification and in the push message. What members wrote — a
message preview, a story title, a rejection reason — is included as written.

## Health

`GET /health` — public, returns status and environment. No secrets.

---

## Rate limiting

Limits are counted **per signed-in member** (from the JWT), or per IP address
before sign-in, so family members sharing one Wi-Fi network do not use up each
other's allowance. Reads and writes are counted separately, because the app
makes several reads each time a screen opens.

| Scope | Default | Setting |
|---|---|---|
| Reads (`GET`) on `/api/` | 2,000 per 15 min | `READ_RATE_LIMIT_MAX` |
| Writes (`POST`, `PUT`, `PATCH`, `DELETE`) on `/api/` | 300 per 15 min | `RATE_LIMIT_MAX` |
| `/api/auth/login`, `/api/auth/register` | 20 per 15 min | `AUTH_RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_WINDOW_MS` |

The window for reads and writes is `RATE_LIMIT_WINDOW_MS`. Every limit answers
`429` with `code: "RATE_LIMITED"`.
