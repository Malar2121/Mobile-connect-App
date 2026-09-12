# Family Connect

A private, invite-only mobile app for families: event scheduling with availability
polling, a celebration calendar with automatic reminders, a shared archive of
photos, videos and stories, real-time chat, and an accessible trilingual interface.

Final-year project — proposal reference **CT_2020_004**.

---

## What it does

| Module | Capability |
|---|---|
| **Family & roles** | Private families, invite-only joining, roles: admin, parent, member, child, guest |
| **Onboarding** | Invite code, QR code (generated and scanned on the phone), and email invitation |
| **Events** | Create, edit, RSVP, event notes, attachments |
| **Availability polling** | Members vote yes / maybe / no on proposed dates |
| **Smart Date Suggestion** | Ranks options by blockers, availability across the whole family, coverage, then date |
| **Celebrations** | Anniversaries and cultural events; birthdays derived from member profiles |
| **Reminders** | Hourly server-side sweep creates each reminder once; push through FCM / Expo once Firebase is configured |
| **Memories** | Photos and videos on Cloudinary, **approved by another member before the family sees them**, per-family storage quota, albums, comments |
| **Stories** | Written family stories and a shared family history journal |
| **Chat** | Real-time messaging over Socket.IO with mentions, file sharing, pinned messages |
| **Accessibility** | Elder Mode (larger type and targets, simplified navigation, spoken prompts) |
| **Languages** | English, Sinhala (සිංහල), Tamil (தமிழ்) — the whole interface, and each member's notifications |
| **Child safety** | Guardian consent required before a minor can see family content |

---

## Repository layout

```
backend/                  Node.js + Express + MongoDB API
  controllers/            Request handlers, all family-scoped
  models/                 Mongoose schemas
  middleware/             Auth, parental consent, guest read-only, media quota, validation
  services/               Access and memory policies, mail, notifications, reminders
  socket/                 Socket.IO server (JWT handshake, per-family rooms)
  tests/                  Jest — unit, integration, performance, and static checks of the mobile code
family-connect-mobile/    React Native (Expo SDK 54) client
  src/screens/            Feature screens
  src/services/           API clients and error translation
  src/i18n/               en / si / ta translation bundles
  src/design-system/      Tokens and shared components
docs/                     Requirements, API, guides, tests, deployment, device testing
```

---

## Getting started

### Prerequisites

- Node.js 18 or newer
- MongoDB (local, or a MongoDB Atlas connection string)
- An Android phone with **Expo Go for SDK 54**, or an Android emulator

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

The API starts on port 5000. Check it with:

```bash
curl -s http://localhost:5000/health
```

### Mobile app

```bash
cd family-connect-mobile && npm install
```

```bash
cd family-connect-mobile && npm start
```

In development the app uses the address of the computer running Metro to reach
the API, so a phone on the same Wi-Fi network needs no configuration. Set
`EXPO_PUBLIC_API_URL` only to point somewhere else.

---

## Environment variables

All backend configuration comes from `backend/.env`. See `.env.example` for the
full list with comments, and `docs/DEPLOYMENT.md` for defaults.

| Variable | Required | Purpose |
|---|---|---|
| `MONGO_URI` | yes | MongoDB connection string |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | yes | Token signing (use long random values) |
| `JWT_EXPIRE`, `JWT_REFRESH_EXPIRE` | no | Token lifetimes |
| `CLOUDINARY_*` | for media | Photo, video and chat file storage |
| `MAX_FILE_SIZE_MB` | no | Largest single upload (default 10) |
| `FAMILY_MEDIA_QUOTA_MB` | no | Photo and video storage per family (default 2048) |
| `FIREBASE_*` | for push | FCM credentials; without them push is disabled and logged |
| `SMTP_*`, `MAIL_FROM` | for email invites | Without them invitations are still created but not emailed |
| `INVITE_LINK_BASE_URL` | for email invites | Base URL used to build the invitation link |
| `CLIENT_URL` | yes in prod | CORS allowlist entry |
| `RATE_LIMIT_MAX`, `READ_RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_*` | no | Writes and reads per member, and sign-in attempts (defaults are safe) |
| `REMINDER_CRON` | no | Reminder sweep schedule, default hourly |
| `DISABLE_REMINDER_SCHEDULER` | no | Set `true` to disable the sweep |

**Never commit `.env`.** It is gitignored; only `.env.example` is tracked.

---

## Testing

```bash
cd backend && npm test
```

Tests use a separate database whose name must contain `test` — the setup
refuses to run otherwise, because it drops collections between files.

```bash
cd backend && npx jest tests/unit
```

The unit suite also checks the mobile code without running it: that every name
used is defined where it is used, that no English is hardcoded, that translation
keys exist in all three languages, and that Elder and Child modes reach the
screens they are meant to, and no others. The Android bundle is built with:

```bash
cd family-connect-mobile && npx expo export --platform android --output-dir ../../expo-export-check
```

There are no automated tests that run the app on a device or emulator, and **the
app has not yet been tested on a physical phone**. See
[docs/TEST_REPORT_FINAL.md](docs/TEST_REPORT_FINAL.md) for results and
[docs/DEVICE_TEST_MATRIX.md](docs/DEVICE_TEST_MATRIX.md) for the device plan.

---

## Documentation

| Document | Contents |
|---|---|
| [docs/REQUIREMENTS_TRACEABILITY.md](docs/REQUIREMENTS_TRACEABILITY.md) | Every proposal requirement, its status and its evidence |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | Every endpoint, auth, error codes and rate limits |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design |
| [docs/USER_GUIDE.md](docs/USER_GUIDE.md) | How to use the app |
| [docs/LANGUAGE_SUPPORT.md](docs/LANGUAGE_SUPPORT.md) | How English, Sinhala and Tamil work, and their guards |
| [docs/TEST_REPORT_FINAL.md](docs/TEST_REPORT_FINAL.md) | Test results and measured performance |
| [docs/DEVICE_TEST_MATRIX.md](docs/DEVICE_TEST_MATRIX.md) | Two-phone test matrix — not yet run |
| [docs/DEVICE_READINESS_AUDIT.md](docs/DEVICE_READINESS_AUDIT.md) | What is needed before testing on phones |
| [docs/MANUAL_TEST_PLAN.md](docs/MANUAL_TEST_PLAN.md) | Device acceptance checklist |
| [docs/SUS_EVALUATION.md](docs/SUS_EVALUATION.md) | Usability study instrument and scoring |
| [docs/MAINTENANCE.md](docs/MAINTENANCE.md) | Bug-fix and update process |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Hosting, Firebase, SMTP and Atlas setup, and the current blocker |
| [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) | What is not finished |

---

## Current status

33 of the proposal's 45 software and evaluation requirements are complete and
none is missing; see [docs/REQUIREMENTS_TRACEABILITY.md](docs/REQUIREMENTS_TRACEABILITY.md).
These items are outstanding and are **not** claimed as done:

- **Physical-device testing** has not been run. The matrix is ready.
- **Production deployment** is blocked on hosting-account access. The backend is
  verified locally; see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
- **Push notifications** need Firebase credentials and a native build; **email
  invitations** need an SMTP provider. Both are implemented but unverified.
- **The SUS usability study** and the family pilot need real participants. No score
  exists.
- **Play Store publication** has not been done.
- **Partial:** videos are not compressed, media URLs are public rather than signed,
  encryption at rest depends on the database host, and performance has been
  measured on one machine only.

---

## Licence

MIT
