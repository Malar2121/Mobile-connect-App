# Family Connect

A private, invite-only mobile app for families: event scheduling with availability
polling, a celebration calendar with automatic reminders, a shared memory archive,
real-time chat, and an accessible trilingual interface.

Final-year project — proposal reference **CT_2020_004**.

---

## What it does

| Module | Capability |
|---|---|
| **Family & roles** | Private families, invite-only joining, roles: admin, parent, member, child, guest |
| **Onboarding** | Invite code, QR code (generated and scanned on-device), and email invitation |
| **Events** | Create, edit, RSVP, event notes, attachments |
| **Availability polling** | Members vote yes / maybe / no on proposed dates |
| **Smart Date Suggestion** | Ranks options by blockers, availability, coverage, then date |
| **Celebrations** | Anniversaries and cultural events; birthdays derived from member profiles |
| **Reminders** | Hourly server-side sweep dispatches reminders via FCM / Expo push |
| **Memories** | Photo and video upload to Cloudinary, albums, captions, comments |
| **Chat** | Real-time messaging over Socket.IO with mentions, file sharing, pinned messages |
| **Accessibility** | Elder Mode (larger type and targets, simplified navigation, spoken prompts) |
| **Languages** | English, Sinhala (සිංහල), Tamil (தமிழ்) |
| **Child safety** | Guardian consent required before a minor can see family content |

---

## Repository layout

```
backend/                  Node.js + Express + MongoDB API
  controllers/            Request handlers, all family-scoped
  models/                 Mongoose schemas
  middleware/             Auth, parental consent, guest read-only, validation
  services/               Mail, notifications, reminder scheduler, JWT
  socket/                 Socket.IO server (JWT handshake, per-family rooms)
  tests/                  Jest — unit, integration, performance
family-connect-mobile/    React Native (Expo) client
  src/screens/            Feature screens
  src/services/           API clients
  src/i18n/               en / ta / si translation bundles
  src/design-system/      Tokens and shared components
docs/                     Architecture, API, accessibility, QA, evaluation
```

---

## Getting started

### Prerequisites

- Node.js 18 or newer
- MongoDB (local, or a MongoDB Atlas connection string)
- An Expo-compatible device or Android emulator

### Backend

```bash
cd backend && npm install
```

Copy `.env.example` to `.env` and fill it in — every value is read from the
environment, and nothing is hardcoded.

```bash
cd backend && cp .env.example .env
```

```bash
cd backend && npm run dev
```

The API starts on `http://localhost:5000`. Check it with:

```bash
curl -s http://localhost:5000/health
```

### Mobile app

```bash
cd family-connect-mobile && npm install
```

Point `EXPO_PUBLIC_API_URL` in `.env.development` at your machine's LAN address
(not `localhost`) if you are running on a physical device, then:

```bash
cd family-connect-mobile && npx expo start
```

---

## Environment variables

All backend configuration comes from `backend/.env`. See `.env.example` for the
full list with comments.

| Variable | Required | Purpose |
|---|---|---|
| `MONGO_URI` | yes | MongoDB connection string |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | yes | Token signing (use long random values) |
| `JWT_EXPIRE`, `JWT_REFRESH_EXPIRE` | no | Token lifetimes |
| `CLOUDINARY_*` | for media | Photo and video storage |
| `FIREBASE_*` | for push | FCM credentials; without them push is disabled and logged |
| `SMTP_*`, `MAIL_FROM` | for email invites | Without them invitations are still created but not emailed |
| `INVITE_LINK_BASE_URL` | for email invites | Base URL used to build the invitation link |
| `CLIENT_URL` | yes in prod | CORS allowlist entry |
| `RATE_LIMIT_*`, `AUTH_RATE_LIMIT_*` | no | Rate limiting (defaults are safe) |
| `REMINDER_CRON` | no | Reminder sweep schedule, default hourly |
| `DISABLE_REMINDER_SCHEDULER` | no | Set `true` to disable the sweep |

**Never commit `.env`.** It is gitignored; only `.env.example` is tracked.

---

## Testing

```bash
cd backend && npm test
```

```bash
cd backend && npm run test:coverage
```

Tests use a separate database whose name must contain `test` — the setup
refuses to run otherwise, because it drops collections between files.

```bash
cd backend && npx jest tests/unit
```

```bash
cd backend && npx jest tests/performance
```

See [docs/TEST_REPORT_FINAL.md](docs/TEST_REPORT_FINAL.md) for current results.

The mobile app has no automated test suite; it is verified by parse checks,
API contract tracing, and the manual checklist in
[docs/MANUAL_TEST_PLAN.md](docs/MANUAL_TEST_PLAN.md).

---

## Documentation

| Document | Contents |
|---|---|
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | Every endpoint, auth, and response shape |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design |
| [docs/USER_GUIDE.md](docs/USER_GUIDE.md) | How to use the app |
| [docs/TEST_REPORT_FINAL.md](docs/TEST_REPORT_FINAL.md) | Test results and measured performance |
| [docs/MANUAL_TEST_PLAN.md](docs/MANUAL_TEST_PLAN.md) | Device acceptance checklist |
| [docs/SUS_EVALUATION.md](docs/SUS_EVALUATION.md) | Usability study instrument and scoring |
| [docs/MAINTENANCE.md](docs/MAINTENANCE.md) | Bug-fix and update process |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Hosting instructions and current blocker |
| [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) | What is not finished |

---

## Current status

The backend, database, API, security model, and test suite are complete and
verified. Two items are outstanding and are **not** claimed as done:

- **Production deployment** is blocked on hosting-account access. The backend is
  verified working locally; see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
- **The SUS usability study** has been prepared but not run — it requires real
  participants. See [docs/SUS_EVALUATION.md](docs/SUS_EVALUATION.md).

Sinhala and Tamil cover the main user journeys; some secondary screens are still
English only. See [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md).

---

## Licence

MIT
