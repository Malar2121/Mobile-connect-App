# Family Connect — Project Structure

Monorepo for the Family Connect final-year research project: a cross-platform family coordination app with real-time chat, events, memories, family tree, and live location safety.

## Repository Layout

```
Family connect App/
├── backend/                    # Node.js + Express + MongoDB + Socket.io API
│   ├── config/                 # DB, Firebase, Cloudinary
│   ├── controllers/            # Route handlers per domain
│   ├── middleware/             # auth, upload, error handling
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # Express routers
│   ├── services/               # Notifications, push, shared logic
│   ├── socket/                 # Socket.io server (chat, location relay)
│   ├── utils/                  # Logger, helpers
│   └── server.js               # App entry point
│
├── family-connect-mobile/      # React Native (Expo 54) client
│   ├── App.js                  # Root providers (Auth, Family, Network, UI)
│   ├── src/
│   │   ├── components/         # Shared UI (map, chat, family, navigation)
│   │   ├── contexts/           # Auth, Family, Chat/Map modules, Network, UI mode
│   │   ├── design-system/      # Tokens, theme, reusable primitives
│   │   ├── hooks/              # Module data hooks (dashboard, chat, map, etc.)
│   │   ├── navigation/         # App, Tab, and module navigators
│   │   ├── screens/            # Feature screens by module
│   │   ├── services/           # REST API clients per domain
│   │   ├── socket/             # Socket.io client singleton
│   │   └── utils/              # Module helpers, offline queue
│   └── scripts/                # Android emulator / Expo helpers
│
└── docs/                       # Architecture & release documentation
```

## Mobile Module Map

| Module | Navigator | Primary Hook | Service |
|--------|-----------|--------------|---------|
| Authentication | `AuthNavigator` | `AuthContext` | `authService.js` |
| Dashboard | Tab → `FamilyDashboard` | `useDashboardData` | multiple |
| Family | `FamilyNavigator` | `useFamilyModuleData` | `familyService.js` |
| Events | `EventsNavigator` | `useEventsModuleData` | `eventService.js`, `pollService.js` |
| Memories | `MemoriesNavigator` | `useMemoriesModuleData` | `memoryService.js`, `albumService.js` |
| Family Tree | `FamilyTreeNavigator` | `useFamilyTreeModuleData` | `familyTreeService.js` |
| Chat | `ChatNavigator` | `useChat` + `ChatModuleContext` | `chatService.js` |
| Map | `MapNavigator` | `useMapModuleData` + `MapModuleContext` | `locationService.js` |
| Notifications | Profile stack | inline | `notificationService.js` |
| Profile / Settings | Profile stack | `UIModeContext` | `authService.js` |

## Backend Route Prefixes

All REST endpoints are under `/api/*`. Socket.io shares the same origin as the HTTP server.

| Prefix | Domain |
|--------|--------|
| `/api/auth` | Register, login, refresh, logout, me |
| `/api/family` | Create, join, invite, leave |
| `/api/events` | CRUD, RSVP |
| `/api/polls` | Event polls |
| `/api/memories` | Upload, list, like, delete |
| `/api/albums` | Album CRUD, share |
| `/api/chat` | Messages, reactions, pin, star, search |
| `/api/notifications` | List, read, delete |
| `/api/family-tree` | Tree graph |
| `/api/location` | Update, family locations, SOS |

## Key Conventions

- **Design system**: Import UI primitives from `src/design-system` (not ad-hoc styles).
- **Module hooks**: Each tab module uses a `use*ModuleData` hook for loading, error, and refresh state.
- **Contexts**: Auth + Family are global; Chat and Map use module-scoped contexts for navigation params.
- **AsyncStorage**: Map safe zones, SOS history, trip points, and UI preferences are cached client-side.
- **Deprecated aliases**: `FamilyDashboard.js` re-exports `DashboardScreen`; `components/Loader.js` re-exports design-system `Loader`.
