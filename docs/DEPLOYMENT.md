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
