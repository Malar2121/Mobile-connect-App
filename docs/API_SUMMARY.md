# Family Connect — API Summary

Base URL: `{API_ORIGIN}/api` (mobile: `EXPO_PUBLIC_API_URL`, default `http://localhost:5000`)

Health check (no auth): `GET /health`

All protected routes require: `Authorization: Bearer <access_token>`

---

## Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Create account |
| POST | `/login` | No | Login, returns tokens |
| POST | `/refresh` | No | Refresh access token |
| POST | `/logout` | Yes | Invalidate refresh token |
| GET | `/me` | Yes | Current user profile |

---

## Family — `/api/family`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/create` | Create family (admin) |
| GET | `/my-family` | Family + members |
| POST | `/join` | Join by invite code |
| POST | `/invite` | Send invite |
| DELETE | `/leave` | Leave family |

---

## Events — `/api/events`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/create` | Create event |
| GET | `/` | List family events |
| GET | `/:id` | Event details |
| PATCH | `/:id` | Update event |
| DELETE | `/:id` | Delete event |
| POST | `/respond` | RSVP response |

---

## Polls — `/api/polls`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create poll |
| GET | `/event/:eventId` | Poll for event |
| GET | `/:pollId` | Poll details |
| POST | `/:pollId/vote` | Cast vote |
| POST | `/:pollId/close` | Close poll |

---

## Memories — `/api/memories`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload` | Upload media (multipart) |
| GET | `/` | List family memories |
| GET | `/:id` | Memory details |
| POST | `/like` | Like/unlike |
| DELETE | `/:id` | Delete memory |

---

## Albums — `/api/albums`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create album |
| GET | `/` | List albums |
| GET | `/:id` | Album details |
| PUT | `/:id` | Update album |
| POST | `/:id/add-media` | Add memories |
| POST | `/:id/share` | Share album |
| DELETE | `/:id` | Delete album |

---

## Chat — `/api/chat`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/send` | Send message (optional media) |
| GET | `/messages` | Paginated messages |
| GET | `/search` | Search messages |
| GET | `/pinned` | Pinned messages |
| GET | `/starred` | Starred messages |
| PATCH | `/:id` | Edit message |
| DELETE | `/:id` | Delete message |
| POST | `/:id/react` | Add reaction |
| POST | `/:id/pin` | Pin message |
| DELETE | `/:id/pin` | Unpin |
| POST | `/:id/star` | Toggle star |

### Socket events (client)

| Event | Direction | Description |
|-------|-----------|-------------|
| `send_message` | Client → Server | Send text (legacy path) |
| `new_message` | Server → Client | New message in family room |
| `message_updated` | Server → Client | Edited message |
| `message_deleted` | Server → Client | Deleted message |
| `typing` / `stop_typing` | Both | Typing indicators |
| `mark_read` / `message_read` | Both | Read receipts |
| `location_update` | Server → Client | Member location changed |
| `sos_alert` | Server → Client | SOS triggered |

---

## Notifications — `/api/notifications`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List notifications |
| POST | `/create` | Create (internal/admin) |
| PUT | `/read/:id` | Mark read |
| DELETE | `/:id` | Delete |

---

## Family Tree — `/api/family-tree`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Full tree graph |
| PUT | `/` | Update tree nodes/edges |

---

## Location — `/api/location`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/update` | Update own location |
| POST | `/sos` | Trigger SOS alert + push |
| GET | `/family` | All family member locations |
| GET | `/:userId` | Single member location |

---

## Common Response Shape

```json
{ "success": true, "data": { ... } }
```

Errors:

```json
{ "success": false, "message": "Human-readable error" }
```

## Rate Limits

- Global: 100 requests / 15 min per IP (`/api/*`)
- Auth login/register: 20 requests / 15 min

## Mobile Service Mapping

| Service file | API prefix |
|--------------|------------|
| `authService.js` | `/auth` |
| `familyService.js` | `/family` |
| `eventService.js` | `/events` |
| `pollService.js` | `/polls` |
| `memoryService.js` | `/memories` |
| `albumService.js` | `/albums` |
| `chatService.js` | `/chat` |
| `notificationService.js` | `/notifications` |
| `familyTreeService.js` | `/family-tree` |
| `locationService.js` | `/location` |
