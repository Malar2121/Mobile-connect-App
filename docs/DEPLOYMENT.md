# Family Connect — deployment guide

## Prerequisites

- Node.js 18+
- MongoDB — Atlas (proposal §5.1) or a local MongoDB for development
- Cloudinary account (photos, videos, chat files)
- Firebase project (push notifications) — optional; without it push is disabled and logged
- SMTP provider (email invitations) — optional; without it invitations are created but not emailed
- Android Studio (emulator) or an EAS Build account

---

## Backend

### 1. Environment variables

Copy `backend/.env.example` to `backend/.env`. **Never commit `.env`.**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | — | `production` in production |
| `PORT` | Local only | `5000` | Hosting platforms inject it — do not set it there |
| `MONGO_URI` | Yes | — | MongoDB connection string |
| `JWT_SECRET` | Yes | — | At least 32 random characters |
| `JWT_REFRESH_SECRET` | Yes | — | A different long random value |
| `JWT_EXPIRE`, `JWT_REFRESH_EXPIRE` | No | `30d`, `90d` in the example | Token lifetimes |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Yes | — | Media storage |
| `CLIENT_URL` | Yes in production | — | CORS allowlist entry (no `*`) |
| `MAX_FILE_SIZE_MB` | No | `10` | Largest single upload; larger files get `413 FILE_TOO_LARGE` |
| `FAMILY_MEDIA_QUOTA_MB` | No | `2048` | Photo and video storage per family; beyond it uploads get `413 MEDIA_QUOTA_EXCEEDED` |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Window for the two limits below |
| `RATE_LIMIT_MAX` | No | `300` | Writes per signed-in member per window |
| `READ_RATE_LIMIT_MAX` | No | `2000` | Reads per signed-in member per window |
| `AUTH_RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_WINDOW_MS` | No | `20`, 15 min | Login and register attempts per IP |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | For push | — | Firebase Admin service account |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | For email invitations | — | Outgoing mail |
| `INVITE_LINK_BASE_URL` | For email invitations | `CLIENT_URL` | Base of the link in the email |
| `INVITE_CODE_EXPIRY_HOURS` | No | `48` | Email invitation lifetime |
| `REMINDER_CRON` | No | hourly | Reminder sweep schedule |
| `DISABLE_REMINDER_SCHEDULER` | No | `false` | Set `true` to stop the sweep |

### 2. Install and run

```bash
cd backend && npm install
```

```bash
cd backend && npm start
```

Verify:

```bash
curl -s http://localhost:5000/health
```

### 3. Production checklist

- [ ] `NODE_ENV=production`
- [ ] `CLIENT_URL` restricted to real app origins
- [ ] New, strong JWT secrets (not the development ones)
- [ ] MongoDB Atlas network access allows the host's egress
- [ ] TLS in front of the API (the platform's, or nginx)
- [ ] Rate limits reviewed for the expected number of members
- [ ] Logs monitored
- [ ] A process manager or the platform's restart policy

---

## External services

### MongoDB Atlas

1. Create a cluster and a database user.
2. **Network Access:** allow the hosting platform's outbound addresses, or the app boots and then fails every request.
3. Set `MONGO_URI` to the `mongodb+srv://…` string, with the database name `family_connect`.
4. Restart and check `/health`, then sign in from the app.

Atlas encrypts data at rest. The local development database does not.

### Firebase Cloud Messaging (push)

The server sends push through Firebase Admin, and through the Expo push service
for Expo tokens. Both need a native build — **Expo Go on Android cannot receive
remote push**, so the app skips registration there.

1. In the Firebase console, create a project and add an Android app with the package name from `app.json`.
2. **Project settings → Service accounts → Generate new private key.** Put its values in `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` (keep the `\n` sequences, and the quotes).
3. Download `google-services.json` for the Android app and configure it for the build (for EAS, upload the FCM V1 credentials with `eas credentials`).
4. Build a development or preview build and install it on a phone.
5. Sign in, allow notifications, and check that `/api/notifications/register-device` receives a token.
6. Trigger a mention or a reminder with the app closed; a system notification should arrive.

Until these steps are done, notifications still appear inside the app, and push is **not verified**.

### SMTP (email invitations)

1. Choose a provider: a transactional service, or a mailbox with an app password.
2. Set `SMTP_HOST`, `SMTP_PORT` (`587` with `SMTP_SECURE=false`, or `465` with `true`), `SMTP_USER`, `SMTP_PASS` and `MAIL_FROM`.
3. Set `INVITE_LINK_BASE_URL`.
4. Restart, send an invitation to an address you control, and confirm that it arrives and the API reports `emailSent: true`.

Without SMTP the API reports `emailSent: false` and returns the token, which can be pasted into **Join a family**.

---

## Mobile

### Development

```bash
cd family-connect-mobile && npm install
```

```bash
cd family-connect-mobile && npm start
```

In development the app finds the API by itself: it uses the address of the computer
running Metro, on port 5000. The phone must be on the same Wi-Fi network as that
computer and able to open `http://<that address>:5000/health` in its browser.
Set `EXPO_PUBLIC_API_URL` only to override that address.

Use **Expo Go for SDK 54** — see `DEVICE_READINESS_AUDIT.md` for installing that
version.

### Production build (EAS)

```bash
cd family-connect-mobile && npx eas-cli build --platform android
```

Before a production build, `EXPO_PUBLIC_API_URL` must point at a working hosted
API.

### Mobile checklist

- [ ] `EXPO_PUBLIC_API_URL` points to the production API, and `/health` answers there
- [ ] Google Maps API key restricted to the Android package
- [ ] Firebase `google-services.json` and FCM credentials configured
- [ ] Location, camera, photos and notification permissions described in `app.json`
- [ ] Tested on a physical device (`DEVICE_TEST_MATRIX.md`)

---

## Socket.IO in production

- Socket.IO shares the HTTP server's port.
- Behind a load balancer with more than one instance, enable WebSocket sticky sessions.
- The app connects the socket to the same origin as the REST API.

---

## Rollback

- **Backend:** redeploy the previous build. Mongoose schemas are additive, so older code still reads newer documents.
- **Mobile:** publish the previous build. Keep the API backward compatible.

## Monitoring

- `/health`
- Unhandled rejections in the server log
- 401, 403 and 429 rates
- Cloudinary storage and Firebase delivery reports

---

## Current deployment status — BLOCKED

**Re-checked on 2026-09-11: there is no live deployment.** Nothing in this
project claims a working production backend.

### The evidence

`https://mobile-connect-app-production.up.railway.app/health` returns:

```
HTTP/1.1 404 Not Found
Server: railway-hikari
x-railway-fallback: true
```

`x-railway-fallback: true` means Railway's edge router had **no service to route
to**. A running instance would answer `/health` with 200, and an application 404
would come back in the app's own JSON envelope.

### This is not a code problem

- `server.listen(process.env.PORT || 5000)` — the correct pattern for a platform-assigned port
- `start: node server.js`, `engines: { node: ">=18" }`
- No `Dockerfile` or `Procfile` needed
- The backend test suite passes locally — see `TEST_REPORT_FINAL.md`

### The blocker

The Railway CLI is not authorised on this machine, and `railway login` is an
interactive browser flow that needs the account owner. The production MongoDB
URI is also not in the repository, as it should not be.

### To restore it

```bash
npx @railway/cli login
```

```bash
npx @railway/cli list
```

If the project still exists, link and deploy from `backend/`:

```bash
cd backend && npx @railway/cli link
```

```bash
cd backend && npx @railway/cli up
```

If `list` shows nothing, the project is gone. Run `railway init`, or deploy to
Render or AWS, the platforms the proposal names (§6.5).

Set the variables from the table above in the platform dashboard before the first
boot. **Do not set `PORT`.**

### Verify before touching the mobile config

```bash
curl -s -w "\n%{http_code}\n" https://YOUR-URL/health
```

Expect `{"success":true,...}` and `200`. If you see `railway-hikari` again, the
service still is not bound.

### If the URL changes, update all five places

1. `family-connect-mobile/.env.production`
2. `family-connect-mobile/eas.json` — `preview.env.EXPO_PUBLIC_API_URL`
3. `family-connect-mobile/eas.json` — `production.env.EXPO_PUBLIC_API_URL`
4. `family-connect-mobile/src/services/api.js` — `PRODUCTION_API_ORIGIN`
5. `backend/server.js` — `productionOrigin` (the CORS allowlist)

React Native sends no `Origin` header, so the mobile app works even if (5) is
stale, but browser clients do not.

### Only then mark deployment complete

After deploying, verify health, sign-in, family, events, memories, chat,
authorisation and CORS against the live URL. Until all of those pass, deployment
remains **BLOCKED**.
