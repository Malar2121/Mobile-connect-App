# Family Connect — API summary

A one-page map of the API. **`API_REFERENCE.md` is the authoritative version**,
with request fields, rules, error codes and status codes.

Base URL: `{API_ORIGIN}/api`. In development the app uses the address of the
computer running Metro on port 5000; `EXPO_PUBLIC_API_URL` overrides it.

Health check (no auth): `GET /health`

All protected routes require `Authorization: Bearer <access_token>`.

---

| Area | Prefix | Main routes |
|---|---|---|
| Auth | `/api/auth` | `POST /register`, `/login`, `/refresh`, `/logout`, `/2fa/*`; `GET /me`; `PATCH /me` (profile and `language`) |
| Family | `/api/family` | `POST /create`, `/join`, `/invite`; `GET /my-family`; `DELETE /leave`; member roles and types; join requests; `GET/PUT /history` (journal) |
| Email invitations | `/api/family/invitations` | Create, list, verify, accept, revoke |
| Events | `/api/events` | `POST /create`; `GET /`, `/notes`, `/:id`; `PATCH/DELETE /:id`; `POST /respond`; `GET/POST /:id/comments` |
| Polls | `/api/polls` | `POST /`; `GET /event/:eventId`, `/:pollId`; `POST /:pollId/vote`, `/:pollId/close` |
| Celebrations | `/api/celebrations` | `GET /`, `POST /`, `GET/PUT/DELETE /:id` |
| Memories | `/api/memories` | `POST /upload`; `GET /`, `/pending`, `/usage`, `/:id`; `POST /:id/approve`, `/:id/reject`, `/like`; comments; `DELETE /:id` |
| Stories | `/api/stories` | `GET /`, `POST /`, `GET/PUT/DELETE /:id` |
| Albums | `/api/albums` | `POST /`, `GET /`, `GET/PUT/DELETE /:id`, `POST /:id/add-media`, `/:id/share` |
| Chat | `/api/chat` | `POST /send`; `GET /messages`, `/search`, `/pinned`, `/starred`; `PATCH/DELETE /:id`; react, pin, star |
| Consent | `/api/consent` | `GET /me`, `/pending`; `POST /:id/approve`, `/:id/reject` |
| Notifications | `/api/notifications` | `GET /`, `POST /create`, `PUT /read/:id`, `POST /register-device`, `DELETE /:id` |
| Family tree | `/api/family-tree` | `GET /`, `PUT /relationship` |
| Location | `/api/location` | `POST /update`, `/sos`, `/sharing`; `GET /family`, `/history/:userId`, `/:userId` |
| Safe zones | `/api/safezones` | `GET /`, `POST /`, `PUT/DELETE /:id` |

## Socket events

| Event | Direction | Description |
|---|---|---|
| `send_message` | Client → Server | Send text; needs write access |
| `typing` / `stop_typing` | Both | Typing indicators; need write access |
| `mark_read` / `message_read` | Both | Read receipts; need read access |
| `new_message`, `message_updated`, `message_deleted` | Server → Client | Chat changes in the family room |
| `family_access` | Server → Client | The member's read and write access changed |
| `location_update`, `location_sharing_changed`, `member_type_changed` | Server → Client | Member changes |
| `sos_alert`, `safezones_changed`, `zone_alert` | Server → Client | Safety |

## Response shape

```json
{ "success": true, "message": "...", "data": { } }
```

Errors:

```json
{ "success": false, "message": "Human-readable error", "code": "MACHINE_CODE" }
```

## Rate limits

Counted per signed-in member, or per IP before sign-in:

- Reads: 2,000 per 15 min (`READ_RATE_LIMIT_MAX`)
- Writes: 300 per 15 min (`RATE_LIMIT_MAX`)
- Login and register: 20 per 15 min (`AUTH_RATE_LIMIT_MAX`)

## Mobile service mapping

| Service file | API prefix |
|---|---|
| `authService.js` | `/auth` |
| `familyService.js` | `/family` |
| `eventService.js` | `/events` |
| `pollService.js` | `/polls` |
| `memoryService.js` | `/memories` |
| `archiveService.js` | `/stories`, `/events/notes`, `/family/history` |
| `albumService.js` | `/albums` |
| `chatService.js` | `/chat` |
| `notificationService.js` | `/notifications` |
| `familyTreeService.js` | `/family-tree` |
| `locationService.js` | `/location`, `/safezones` |
