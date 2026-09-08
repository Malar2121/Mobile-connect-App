# Family Connect — Deployment Guide

## Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)
- Cloudinary account (media uploads)
- Firebase project (push notifications)
- Android Studio (mobile) or EAS Build account

---

## Backend Deployment

### 1. Environment Variables

Copy `backend/.env.example` to `backend/.env` and set:

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `production` in prod |
| `PORT` | Yes | Default `5000` |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Min 32 characters |
| `JWT_REFRESH_SECRET` | Yes | Refresh token secret |
| `CLOUDINARY_*` | Yes | Media storage |
| `FIREBASE_*` | Yes | FCM push |
| `CLIENT_URL` | Yes | Mobile app origin (no `*` in prod) |

### 2. Install & Run

```bash
cd backend
npm install
npm start
```

Verify: `GET https://your-api.example.com/health`

### 3. Production Checklist

- [ ] `NODE_ENV=production`
- [ ] Restrict `CLIENT_URL` to app origins
- [ ] Use strong JWT secrets (rotate from dev)
- [ ] Enable MongoDB IP allowlist
- [ ] Configure reverse proxy (nginx) with TLS
- [ ] Set `RATE_LIMIT_MAX` appropriate for traffic
- [ ] Monitor logs (morgan → logger)
- [ ] Process manager (PM2, systemd, or container orchestrator)

### 4. Docker (optional)

Containerize `backend/` with Node 18 Alpine, expose `PORT`, inject env via secrets manager.

---

## Mobile Deployment

### 1. Environment

Create `family-connect-mobile/.env`:

```
EXPO_PUBLIC_API_URL=https://your-api.example.com
```

For Android emulator against local backend:

```
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000
```

Run `npm run reload` or `adb reverse` for port forwarding.

### 2. Development

```bash
cd family-connect-mobile
npm install
npm run android    # Emulator
npm start          # Physical device via Expo
```

### 3. Production Build (EAS)

```bash
npx eas-cli build --platform android
npx eas-cli build --platform ios
```

Configure `app.json` / `eas.json` with:
- Bundle identifier
- Push notification credentials
- Location permissions strings (Map module)

### 4. Mobile Checklist

- [ ] `EXPO_PUBLIC_API_URL` points to production API
- [ ] Google Maps API key (if using native maps features)
- [ ] Firebase `google-services.json` / `GoogleService-Info.plist`
- [ ] Expo notifications configured
- [ ] Location permissions in `app.json`
- [ ] Test on physical device (push, GPS, camera)

---

## Socket.io in Production

- Socket.io shares the HTTP server port.
- Ensure load balancer supports WebSocket sticky sessions if scaling horizontally.
- Mobile client uses `API_ORIGIN` for socket connection (same host as REST).

---

## Recommended Release Versioning

| Stage | Version | Tag |
|-------|---------|-----|
| RC1 | `1.0.0-rc.1` | Map module complete |
| **RC2** | **`1.0.0-rc.2`** | **Production hardening (this release)** |
| GA | `1.0.0` | After QA sign-off |

Update `family-connect-mobile/package.json` version before store submission.

---

## Rollback

- Backend: redeploy previous container/image; MongoDB migrations are schema-less (Mongoose).
- Mobile: publish previous EAS build to stores; API must remain backward compatible.

---

## Monitoring

- Health endpoint: `/health`
- Watch for `Unhandled Rejection` in server logs
- Track 401/403 rates (auth issues)
- Monitor Cloudinary quota and Firebase delivery reports

---

## Current deployment status — BLOCKED

**As of commit `d2ad793`, there is no live deployment.** This section is kept
accurate deliberately; nothing in this project claims a working production
backend.

### The evidence

`https://mobile-connect-app-production.up.railway.app` returns 404 on every
path, with these response headers:

```
Server: railway-hikari
x-railway-fallback: true
{"status":"error","code":404,"message":"Application not found"}
```

`x-railway-fallback: true` means Railway's **edge router had no upstream service
to route to**. This is not the application returning 404 — a running instance
would answer `/health` with 200, and a genuine miss would come back in the app's
own envelope from `middleware/errorHandler.js`. **No service is bound to that
hostname**: the Railway service or project no longer exists.

### This is not a code problem

The backend is verified deployable:

- `server.listen(process.env.PORT || 5000)` — the correct pattern for a
  platform-assigned port
- `start: node server.js`, `engines: { node: ">=18" }`
- No `Dockerfile` or `Procfile` needed; Nixpacks auto-detects a Node app
- Verified working locally: 20/20 smoke tests, 170/170 Jest tests

### The blocker

`npx @railway/cli whoami` returns **`Unauthorized`**, and no `RAILWAY_TOKEN` is
present. `railway login` is an interactive browser flow that requires the
account owner. **This needs a human with account access.**

The production MongoDB URI is also required and is not in this repository —
`backend/.env` points at a local database, and `.env` is correctly gitignored.

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

If `list` shows nothing, the project is gone — use `railway init` instead, or
deploy to Render or AWS as the proposal (§6.5) actually names.

Set these in the platform dashboard before the first boot. **Do not set `PORT`**
— the platform injects it:

`NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,
`JWT_EXPIRE`, `JWT_REFRESH_EXPIRE`, `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLIENT_URL`, `MAX_FILE_SIZE_MB`,
`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`.

Optional: `FIREBASE_*` (without them push is disabled and logged, not failed),
`SMTP_*` and `INVITE_LINK_BASE_URL` (without them email invitations are created
but not sent).

In MongoDB Atlas, allow the host's egress in Network Access, or the app will
boot and then fail every request.

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

Missing one produces a confusing partial failure. Note that React Native sends
no `Origin` header, so the mobile app works even if (5) is stale — but browser
clients will not.

### Only then mark deployment complete

After deploying, verify health, login, family, events, memories, chat, family
tree, authorisation and CORS against the live URL. Until every one of those
passes, deployment remains **BLOCKED**.
