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

Errors return `{ "success": false, "message": "..." }`, sometimes with a
machine-readable `code`. Stack traces are included only when
`NODE_ENV=development`.

**Family scoping.** Every family resource is queried as
`findOne({ _id, familyId })` against the caller's own family. Cross-family reads
return `404`, never another family's data.

### Middleware guards

| Guard | Effect |
|---|---|
| `protect` | Valid JWT required; attaches `req.user` |
| `requireFamily` | Caller must belong to a family |
| `requireParentalConsent` | A `memberType: 'child'` account is blocked until a guardian approves — `403` with `CONSENT_PENDING` or `CONSENT_REJECTED` |
| `denyGuestWrites` | A `role: 'guest'` account may read but not write — `403` with `GUEST_READ_ONLY`. SOS is exempt |

### Status codes

| Code | Meaning |
|---|---|
| 200 / 201 | Success |
| 202 | Accepted — join request pending admin approval |
| 400 | Invalid input |
| 401 | Missing, invalid or expired token |
| 403 | Authenticated but not permitted (role, consent, family membership) |
| 404 | Not found, or not in your family |
| 409 | Conflict — duplicate email, invite, or celebration |
| 410 | Gone — invitation expired, revoked or already used |
| 422 | Schema validation failed |
| 429 | Rate limited |

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
| PATCH | `/me` | ✓ | Update profile, `dateOfBirth`, push preferences |
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

### Email invitations — `/api/family/invitations`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/invitations` | ✓ admin/parent | Invite by `email`, optional `role` (`member`/`parent`/`guest` — **never `admin`**). Returns `emailSent`; when mail is unconfigured or fails it returns `emailSent: false`, a `deliveryReason`, and the raw `token` so the invite can still be shared |
| GET | `/invitations` | ✓ admin/parent | List this family's invitations |
| GET | `/invitations/verify/:token` | ✓ | Check a token; returns only the family name |
| POST | `/invitations/accept` | ✓ | Accept with `{ token }`. Single use, expiring, bound to the invited email |
| DELETE | `/invitations/:id` | ✓ admin/parent | Revoke |

Only a SHA-256 hash of the token is stored.

## Events — `/api/events`

| Method | Path | Purpose |
|---|---|---|
| POST | `/create` | Create; accepts `title`, `date`, `startTime`, `endTime`, `location`, `image`, `reminders` (minutes before), `recurrenceRule`, `attachments` |
| GET | `/` | Family events |
| GET/PATCH/DELETE | `/:id` | Read, update, delete |
| POST | `/respond` | RSVP: `accepted`, `declined`, `maybe` |
| GET/POST | `/:id/comments` | **Event notes** — list and add |

## Availability polls — `/api/polls`

| Method | Path | Purpose |
|---|---|---|
| POST | `/` | Create a poll with dated options |
| GET | `/event/:eventId` · `/:pollId` | Read, with `results`, `suggestion`, `suggestionReason` |
| POST | `/:pollId/vote` | Vote `yes`/`maybe`/`no`; returns the updated suggestion |
| POST | `/:pollId/close` | Close, optionally recording the chosen option |

**Smart Date Suggestion** ranks options by fewest blockers, then availability,
then coverage, then earliest date. Availability is measured against the whole
family, not only those who replied. Past options are never suggested; with no
votes the response says `no_responses_yet` rather than inventing a winner.

## Celebrations — `/api/celebrations`

| Method | Path | Purpose |
|---|---|---|
| GET | `/?days=365` | Upcoming, sorted by proximity. Includes **virtual birthdays** derived from members' `dateOfBirth` |
| POST | `/` | Create `anniversary`, `cultural` or `other`. `birthday` is rejected — birthdays come from profiles |
| GET/PUT/DELETE | `/:id` | Read, update, delete (creator or admin) |

## Memories — `/api/memories`

| Method | Path | Purpose |
|---|---|---|
| POST | `/upload` | Multipart `media`; images and video to Cloudinary, size and type limited |
| GET | `/` · `/:id` | List, detail |
| POST | `/like` | Toggle like |
| GET/POST | `/:id/comments` | Notes on a memory |
| DELETE | `/:id` | Delete |

## Albums — `/api/albums`

`POST /` · `GET /` · `GET /:id` · `PUT /:id` · `POST /:id/add-media` ·
`POST /:id/share` · `DELETE /:id` — paginated with `page` and `limit`.

## Chat — `/api/chat`

| Method | Path | Purpose |
|---|---|---|
| POST | `/send` | Send text and/or `media`. `@Full Name` is resolved server-side into `mentions` |
| GET | `/messages?limit=&before=` | History, newest last, capped at 200 |
| GET | `/search` · `/pinned` · `/starred` | Query views |
| PATCH/DELETE | `/:id` | Edit (re-resolves mentions) / delete own message |
| POST | `/:id/react` · `/:id/star` · `/:id/pin` · DELETE `/:id/pin` | Reactions, stars, pinning |

**Socket.IO** authenticates with the JWT in `handshake.auth.token` and joins
`family_<familyId>`. Events: `new_message`, `typing`, `stop_typing`,
`mark_read`, `message_read`, `message_updated`, `message_deleted`.

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

Types: `chat_message`, `chat_mention`, `event_reminder`,
`celebration_reminder`, `birthday_reminder`, `consent_requested`,
`consent_approved`, `consent_rejected`, `geofence_*`.

## Health

`GET /health` — public, returns status and environment. No secrets.

---

## Rate limiting

| Scope | Default |
|---|---|
| All `/api/` | 100 requests / 15 min |
| `/api/auth/login`, `/api/auth/register` | 20 / 15 min |

Both configurable via `RATE_LIMIT_*` and `AUTH_RATE_LIMIT_*`.
