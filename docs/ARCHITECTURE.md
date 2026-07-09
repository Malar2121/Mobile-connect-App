# Family Connect — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    family-connect-mobile                         │
│  Expo 54 · React Native · React Navigation 7                   │
├─────────────────────────────────────────────────────────────────┤
│  UI Layer          │ Screens + design-system components         │
│  State Layer       │ Contexts (Auth, Family, Network, UI mode)  │
│  Data Layer        │ Module hooks + domain services             │
│  Transport         │ Axios (REST) + Socket.io (real-time)       │
│  Persistence       │ SecureStore (JWT) · AsyncStorage (prefs)   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / WSS
┌────────────────────────────▼────────────────────────────────────┐
│                         backend                                  │
│  Express · Helmet · CORS · Rate limiting                         │
├─────────────────────────────────────────────────────────────────┤
│  REST /api/*       │ Controllers → Mongoose models              │
│  Socket.io         │ JWT auth · family rooms · chat + location  │
│  External          │ MongoDB Atlas · Cloudinary · Firebase FCM  │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

1. User registers or logs in via `POST /api/auth/register` or `/login`.
2. Server returns access JWT + refresh token; mobile stores tokens in `expo-secure-store`.
3. `setAuthToken()` attaches `Authorization: Bearer` to all Axios requests.
4. `protect` middleware validates JWT on protected routes; deactivated users receive 403.
5. On logout, tokens are cleared and `disconnectSocket()` runs.
6. Token refresh via `POST /api/auth/refresh` when access token expires.

## Real-Time Layer

**Socket client** (`src/socket/socketClient.js`):

- Singleton connection per app session.
- Authenticates with JWT in `handshake.auth.token`.
- Subscribes to `new_message`, `message_updated`, `message_deleted`, `location_update`, `sos_alert`.
- Relay pattern: multiple hooks register listeners; socket unsubscribes on last listener removal.

**Socket server** (`backend/socket/socketServer.js`):

- JWT middleware on connection.
- Users join `family_{familyId}` room.
- Handles `send_message`, typing indicators, read receipts.
- Location updates emitted from REST controller via `req.app.get('io')`.

## Module Data Pattern

Each feature module follows the same lifecycle:

```
useFocusEffect → load() → service API calls → setState
                ↓
         loading / error / empty UI in screens
                ↓
         pull-to-refresh → refresh() (sets refreshing flag)
```

Hooks avoid full-screen loading flashes when cached data exists (see `useMemoriesModuleData`, `useChat`, `useMapModuleData`).

## Offline Architecture (RC2)

| Component | Role |
|-----------|------|
| `NetworkContext` | Health ping to `/health`, Axios interceptor feedback, AppState refresh |
| `offlineQueue.js` | Persists failed mutating requests; `flushOfflineQueue` on reconnect |
| `OfflineBanner` | Global alert when API is unreachable |
| `bindNetworkStatusCallback` | Axios response interceptor updates online state |

Processors for the offline queue can be registered per domain as backend retry endpoints are finalized.

## UI Modes

`UIModeContext` supports **standard**, **minor**, and **elder** modes:

- Adjusts font scale, touch targets, and spacing via `resolveTheme()`.
- Theme preference: light / dark / system.
- Persisted in AsyncStorage.

## Security Boundaries

- All family-scoped data queries filter by `req.user.familyId`.
- File uploads validated in multer/Cloudinary middleware (type + size).
- Production error handler hides stack traces (`errorHandler.js`).
- Auth middleware 500 responses are sanitized (no internal error leakage).
- Socket connect/disconnect logs gated behind `NODE_ENV !== 'production'`.

## Navigation Hierarchy

```
AppNavigator
├── AuthNavigator (unauthenticated)
└── TabNavigator (authenticated)
    ├── Dashboard
    ├── EventsNavigator
    ├── MemoriesNavigator
    ├── ChatNavigator
    ├── MapNavigator
    └── ProfileNavigator
        ├── ProfileMain
        ├── FamilyModule → FamilyNavigator
        ├── FamilyTreeModule → FamilyTreeNavigator
        ├── Notifications
        └── CreateFamily / JoinFamily
```
