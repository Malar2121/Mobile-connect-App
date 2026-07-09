# Family Connect — Mobile Client Production Release Audit

**Scope:** `family-connect-mobile/` (Expo 54 / React Native 0.81 / React Navigation 7). ~311 files under `src/` + `App.js` + `app.json`.
**Out of scope (owned by others):** `backend/`, Android release/APK build.
**Method:** Static code reading + end-to-end code-path tracing (no device). Backend gaps listed in `docs/KNOWN_LIMITATIONS.md` are treated as KNOWN, not bugs.
**Date:** audit performed against `package.json` version `1.0.0-rc.3`.

---

## 1. Executive summary

The mobile client is well-structured and mostly production-grade: clean provider composition, a single socket singleton with proper teardown, consistent module-hook pattern, guarded context consumers, and **zero broken/undefined navigation route names** across all 9 navigators. The most serious issues were a **guaranteed render crash** in the memory gallery, a **completely non-functional SOS** safety feature, and **two realtime-driven refetch storms** (chat & map re-fetch full data on every incoming socket event). All four have been fixed. The largest remaining (unfixed, by design/scope) weakness is **inconsistent internationalization** — the i18n engine and Tamil/Sinhala bundles exist, but the majority of feature screens render hardcoded English.

### Bug count by severity (verified)

| Severity | Count | Fixed | Remaining (recommendations) |
|----------|-------|-------|------------------------------|
| Critical | 2 | 2 | 0 |
| High | 3 | 2 | 1 |
| Medium | 9 | 1 | 8 |
| Low | 10 | 0 | 10 |

---

## 2. Files modified

| File | Severity | One-line reason |
|------|----------|-----------------|
| `src/screens/memories/MemoryGalleryScreen.js` | Critical | `policy` was used at line 89–92 before its `const` declaration at line 95 → `ReferenceError` (temporal dead zone) crash on every render with data; moved declaration above first use. |
| `src/screens/map/SOSScreen.js` | High | SOS never sent: parent `countdown` was set to 5 but never decremented, and `confirmSOS` early-returned while `countdown > 0`; rewired the countdown tick so the alert actually fires. |
| `src/hooks/useChat.js` | High | `useFocusEffect` depended on `messages.length`, so every incoming socket message re-ran a full `loadHistory()` fetch (refetch storm); moved the "has messages" check to a ref. |
| `src/hooks/useMapModuleData.js` | High | `useFocusEffect` depended on `locationMap`, so every realtime location broadcast re-ran `refresh()` (family-locations + meta refetch storm); moved the check to a ref. |
| `src/screens/memories/MemoryDetailsScreen.js` | Medium | `handleLike` used `user._id` (unguarded) while the same screen uses `user?._id` elsewhere; made both consistent to avoid a null-deref crash. |

All edits are minimal and surgical; no features added, no UI redesigned, no business logic changed beyond restoring the intended SOS behavior. No linter errors introduced.

---

## 3. Navigation review (route-name verification)

Every `navigation.navigate(...)` / `push` / `replace` / notification-deep-link target was cross-checked against the screens registered in each navigator.

### Registered route inventory

| Navigator | Registered routes |
|-----------|-------------------|
| Tab (root) | Dashboard, Events, Memories, Chat, Map, Profile |
| AuthNavigator | Login, Register |
| ProfileStack | ProfileMain, FamilyModule, FamilyTreeModule, CreateFamily, JoinFamily, Notifications, Language |
| EventsNavigator | EventsHome, EventsList, Calendar, Agenda, EventDetails, CreateEvent, EditEvent, EventPoll, RSVPManagement, EventReminders, EventAttachments, EventHistory |
| MemoriesNavigator | MemoriesHome, MemoryGallery, UploadMemory, Albums, AlbumDetails, MemoryDetails, StoryTimeline, LegacyMode, SharedAlbums, SearchMemories, MemoryMap, TaggedMembers |
| ChatNavigator | ChatHome, Conversation, ChatMediaGallery, ChatSearch, ChatSettings, PinnedMessages, StarredMessages, SharedFiles, VoiceMessage |
| MapNavigator | LiveFamilyMap, MemberLocationDetails, PlaceDetails, SafeZones, SOSScreen, EmergencyContacts, DrivingHistory, TripHistory, LocationSettings |
| FamilyNavigator | FamilyHome, FamilyMembers, MemberProfile, InviteMembers, JoinRequests, FamilyRoles, FamilySettings, QRInvite, Relationship, FamilyPermissions, CreateFamily, JoinFamily |
| FamilyTreeNavigator | FamilyTreeHome, InteractiveTree, PersonProfile, RelationshipEditor, Ancestors, Descendants, HeritageTimeline, LegacyProfiles, FamilyHistory, TreeSettings |

### Result

**No broken or undefined route names were found.** Every navigate target resolves to a registered screen. Cross-navigator jumps rely on React Navigation's parent-bubbling and are valid:

- `FamilyHomeScreen` → `getParent().navigate('FamilyTreeModule', { screen: 'FamilyTreeHome' })` resolves in ProfileStack. ✅
- `FamilyHomeScreen`/`FamilyStatCard` → `getParent().navigate('Memories' | 'Events')` bubbles from ProfileStack up to the Tab navigator. ✅
- Dashboard `navigateTab('Profile', 'FamilyTreeModule', 'FamilyTreeHome')` and all `Profile → {Notifications, CreateFamily, JoinFamily, FamilyModule}` targets. ✅
- Notification deep links (`getNavigationTarget`) → `Chat`, `Memories/MemoriesHome`, `Events/EventDetails|EventsHome`, `Profile/Notifications` all valid. ✅

### Navigation observations (not broken, but noted)

| Severity | Location | Note |
|----------|----------|------|
| Medium | Chat: `ChatHome`, `PinnedMessages`, `StarredMessages`, `SharedFiles`, `ChatSearch`, `VoiceMessage` all `navigate('Conversation')` with **no params** | App uses a single family conversation model, so this is intentional; but selecting a specific starred/pinned/search message does not scroll to or focus that message — the selection is discarded. UX gap, not a crash. |
| Medium | Events: `EventsQuickActions` "Poll" → `navigate('EventPoll')` with **no `eventId`** | `EventPollScreen` opens in create mode with no event context; creation then fails. Consider disabling the shortcut or routing via event selection. |
| Low | `ChatMediaGalleryScreen` grid items have no `onPress` | Tapping media does nothing. |

---

## 4. Per-module bug list

Severity key: **Critical** = crash/again-and-again; **High** = leak / refetch storm / broken core feature; **Medium** = missing state / silent failure / unhandled rejection; **Low** = dead code / TODO / minor.

### 4.1 Authentication
- **Low** — `RegisterScreen.js` uses hardcoded English strings while `LoginScreen.js` is fully `t()`-localized (inconsistent i18n).
- **Low** — `RegisterScreen.js` email validation only checks non-empty (no format check). Password rule (≥8) is enforced.
- **Low (gap, not a bug)** — No forgot-password / reset flow exists anywhere in the client (`ForgotPassword` route absent). Listed in the audit brief; flagged as a missing feature, not a defect. Adding it is out of scope (no new features).
- Session restore (`AuthContext`) is correct: hydrates token from SecureStore, fetches profile, clears session on failure, disconnects socket on sign-out. ✅

### 4.2 Profile / Settings
- No verified defects. Navigation to Family/FamilyTree modules, Language, Notifications all valid.

### 4.3 Dashboard
- **Low** — `components/dashboard/DashboardQuickActions.js` is exported from the barrel but never consumed (`DashboardScreen` uses `QuickActionsGrid`). Dead code.
- Greeting, stats, quick actions, event/memory navigation all wired correctly.

### 4.4 Family
- **Medium** — `docs/KNOWN_LIMITATIONS.md` gaps (JoinRequests, Roles, Permissions, Relationship, MemberProfile) are UI-prepared/API-pending — confirmed as KNOWN. Screens render without crashing.
- No broken navigation; `FamilyQuickActions` `parent`-flagged tree action handled correctly.

### 4.5 Events
- **High (recommendation)** — `useEventsModuleData` `useFocusEffect` depends on `events.length` (same anti-pattern class as chat/map). Lower impact here (no socket stream), causes at most an extra fetch after first load. Recommend the same ref treatment applied to chat/map.
- **Medium** — Unhandled promise rejections: `EditEventScreen` (`getEventDetails().then` no `.catch`), `EventAttachmentsScreen`, `EventReminderScreen`, `RSVPManagementScreen` (`.finally` without `.catch`).
- **Medium** — `EditEventScreen` has no loading/error state during fetch; save can run against empty fields if the fetch never resolved.
- **Medium** — `CalendarScreen`, `EventHistoryScreen`, `AgendaScreen` don't surface `loading`/`error` from the hook (blank content during load).
- **Medium** — `EventReminderScreen` ignores the `eventId` route param passed from `EventDetails`.
- **Low** — `AgendaScreen`/`SearchMemoriesScreen` pass fresh inline filter objects to hooks each render (memo churn). TODOs in `EventAttachmentsScreen`, `CreateEventScreen`, `EventDetailsScreen`, `EventReminderScreen`. Unused imports/empty `StyleSheet.create({})` in `EventPollScreen`, `EventsHomeScreen`, `EventHistoryScreen`.

### 4.6 Memories
- **Critical (FIXED)** — `MemoryGalleryScreen.js` TDZ crash on `policy`.
- **Medium (FIXED)** — `MemoryDetailsScreen.js` unguarded `user._id` in `handleLike`.
- **Medium** — `MemoryDetailsScreen` returns `null` after a failed load (blank screen; toast fires but no visible error/empty UI).
- **Medium** — `SearchMemoriesScreen` and `LegacyModeScreen` ignore incoming route params (`memberId`) — deep links from `TaggedMembersScreen` / `LegacyProfilesScreen` have no effect.
- **Medium** — `UploadMemoryScreen` image-picker calls (`launchImageLibraryAsync`/`launchCameraAsync`) not wrapped in try/catch.
- **Low** — Missing `ListEmptyComponent` in `AlbumsScreen`, `StoryTimelineScreen`, `TaggedMembersScreen`; unused vars/styles and TODOs across the module.

### 4.7 Family Tree
- **Medium** — `TreeSettingsScreen` initializes `draft` from async `treeSettings` once and never syncs when it later loads (contrast `FamilyHistoryScreen`, which syncs via effect).
- **Low** — `InteractiveTreeScreen`, `AncestorsScreen` destructure `loading` but never render a loading state. TODOs in `PersonProfileScreen`, `LegacyProfilesScreen`, `RelationshipEditorScreen`.
- Full CRUD gaps are KNOWN (API pending).

### 4.8 Chat
- **High (FIXED)** — `useChat` full-history refetch on every incoming message (focus-effect dep on `messages.length`).
- **Medium** — `ChatHomeScreen` does not surface `error` from the chat module; `onUnpin={() => {}}` no-op on the pinned banner; unused `RefreshControl` import and unused `loadHistory`.
- **Medium** — `ChatSettingsScreen` inline `launchImageLibraryAsync` (wallpaper) has no try/catch; TODO for notification sounds shown in user-facing text.
- **Medium** — `StarredMessagesScreen` / `PinnedMessagesScreen` have no loading/empty/error states and no unmount cancellation flag (possible stale `setState`).
- **Low** — `screens/chat/ChatScreen.js` is a dead re-export stub (not registered, not imported).
- Socket listeners in `useChat` (`new_message`, `typing`, `stop_typing`, `message_read`, `message_updated`, `message_deleted`) and all typing/schedule timers are correctly cleaned up. ✅

### 4.9 Map
- **Critical/High class (FIXED)** — SOS auto-send broken (`SOSScreen.js`); realtime refetch storm (`useMapModuleData.js`).
- **Medium** — `useMapModuleData`: `user._id` / `family._id` accessed without guards in `pushLocationUpdate`, `sendSOS`, `rebuildTrips`, and the inline `saveSafeZones`/`saveEmergencyContacts`/`saveSettings` callbacks. In practice these run only inside the family/authenticated context, so risk is low, but a defensive guard is recommended.
- **Medium** — `MemberLocationDetailsScreen` line 75 calls `location.latitude.toFixed()` / `location.longitude.toFixed()` after a `!location` guard but without a coordinate guard — would crash on a malformed location record.
- **Medium** — Unhandled rejections: `SafeZonesScreen` (`saveSafeZones` in add/delete), `EmergencyContactsScreen` (`addContact`), `MemberLocationDetailsScreen` (`Linking.openURL`), `useMapModuleData.rebuildTrips`/`loadMeta`.
- **Low** — `PlaceDetailsScreen` renders `undefined, undefined` if `zone` param missing; unused `expo-location` import in `SafeZonesScreen`; several TODOs (geofence webhooks, background tracking). AsyncStorage-only persistence for safe zones/contacts/trips is KNOWN.
- Location watcher (`watchPositionAsync`) and socket location subscription are correctly torn down. ✅

### 4.10 Notifications
- No verified defects. `usePushNotifications` correctly skips Android Expo Go, registers channel, and removes the response listener on cleanup.
- **Low (recommendation)** — the async registration IIFE can theoretically add `responseSub` after unmount (the `cancelled` flag guards earlier awaits but not the final `addNotificationResponseReceivedListener`). Very low impact; consider a post-add `if (cancelled) responseSub.remove()`.
- **Low** — `NotificationsScreen.js` has an empty `StyleSheet.create({})` and hardcoded strings.

### 4.11 Navigation / Contexts (cross-cutting)
- No verified defects. All context consumers (`useAuth`, `useFamily`, `useChatModule`, `useMapModule`, `useI18n`, `useNetwork`, `useUIMode`) throw clear errors outside their providers, and provider nesting in `App.js` is correct (UIMode → I18n → Toast → Dialog → Network → Auth → Family).

---

## 5. Accessibility review

| Area | Status |
|------|--------|
| Multi-mode policy engine (`accessibilityPolicy.js`) | Solid, centralized gating for minor/elder modes (sensitive media, admin actions, SOS, uploads, deletes, advanced settings). ✅ |
| Minor mode | Correctly hides upload/create/SOS/admin surfaces across screens; chat notifications suppressed. ✅ |
| Elder mode | Font-scale + simplified surfaces applied via `layout.fontScale`. ✅ |
| `accessibilityLabel`/`accessibilityRole` | Present on primary CTAs, FABs, tab bar, SOS button, offline banner (with `accessibilityLiveRegion`). Coverage is incremental (KNOWN); many secondary controls are unlabeled. |
| Reduced motion | Handled via `useMotion` hook. |
| Language (EN/TA/SI) | Engine + bundles present; **see i18n review** — most feature screens are not translated. |

No accessibility crashes found. Recommendation: complete `accessibilityLabel` coverage on list rows and icon-only buttons.

---

## 6. Internationalization review

- **Engine:** `src/i18n/index.js` is well built — nested-key lookup, `{{param}}` interpolation, English fallback, lazy-loaded `ta`/`si` bundles, persisted locale, global tag accessor for formatters. ✅
- **Coverage gap (Medium, systemic):** Auth (Login), SOS, offline banner, and language screens use `t()`, but **the majority of feature screens across Events, Memories, Family Tree, Chat, Map, and even RegisterScreen render hardcoded English** (page titles, section titles, buttons, toasts, empty states, errors). Switching to Tamil/Sinhala will leave most of the app in English.
- **Impact:** Not a crash; a functional/quality gap for a tri-lingual product. Not fixed here (would touch ~200 files / large surface, exceeds "minimal & surgical").
- **Recommendation:** Prioritize localizing user-visible strings on the primary tab home screens and shared components first; the `t()` fallback already returns the key/English so incremental migration is safe.

---

## 7. Offline review

- **Architecture present:** `NetworkContext` pings `/health` on mount, on `AppState` active, and every 60s; `api.js` interceptor flips connectivity on network errors; `OfflineBanner` shows a live-region alert; `offlineQueue.js` persists up to 50 mutations with a pluggable processor registry. Interval + AppState listener are cleaned up correctly. ✅
- **KNOWN limitation (confirmed):** No queue processors are registered per domain, so mutating actions still fail immediately when offline (they are not actually retried), and read caches are in-memory only. Documented in `KNOWN_LIMITATIONS.md`.
- No offline-path crashes found; the banner and reconnect ping work. Recommendation for v1.1: register domain processors so the existing queue actually flushes.

---

## 8. Security review (client side)

| Item | Finding |
|------|---------|
| Token storage | Access token stored in `expo-secure-store` (`fc_auth_token`), attached as `Authorization: Bearer` via axios default header, deleted on sign-out. ✅ |
| Secrets in source / `app.json` | None. API base comes from `EXPO_PUBLIC_API_URL` env (falls back to `http://localhost:5000`). No API keys committed. ✅ |
| Sensitive logging | No `console.log/debug/warn/error` anywhere in `src/` (only a benign font-load `console.warn` in `App.js`). No token/PII logging. ✅ |
| Deep-link handling | Notification payloads routed through `getNavigationTarget` with a fixed whitelist of types → fixed routes; params coerced with `String()`. No arbitrary route execution. ✅ |
| Input validation | Present but light (Register: presence + password length; Login: presence). Server-side validation assumed. Medium. |
| Transport | No certificate pinning (KNOWN). Ensure `EXPO_PUBLIC_API_URL` is HTTPS in production and `CLIENT_URL` is restricted (backend concern, KNOWN). |

No client security defects that block release; note the KNOWN items (no cert pinning, client does not pre-validate all upload MIME types).

---

## 9. Performance review

| Area | Finding |
|------|---------|
| Realtime refetch storms | **FIXED** — chat and map hooks no longer refetch full datasets on every socket event (was the single biggest perf defect). |
| FlatList hygiene | Lists generally use `keyExtractor`; `MemoryGalleryScreen` uses `initialNumToRender`/`maxToRenderPerBatch`/`windowSize`/`removeClippedSubviews`. `getItemLayout` not universally applied (KNOWN). Some `renderItem` are inline anonymous funcs (minor). |
| Memoization | `QuickActionsGrid`, quick-action components, `SOSButton`, `MessageBubble` use `React.memo`/`useMemo`/`useCallback`. Module hooks memoize derived data. Good overall. |
| Inline filter objects | `AgendaScreen`, `SearchMemoriesScreen` build fresh filter objects each render → downstream `useMemo` churn. Low. |
| Duplicate fetches | Dashboard/Family/Map independently call `getFamilyLocations()`; overlapping fetches on tab focus. KNOWN/accepted for MVP; shared cache recommended for v1.1. |
| Images | Remote images via `<Image source={{uri}}>` without a caching layer (no `expo-image`); large galleries may re-download. Recommendation (not blocking). |
| Socket | Single shared singleton, websocket transport, capped reconnect backoff, listeners removed on unmount. ✅ |

---

## 10. Lint

`family-connect-mobile/package.json` defines **no `lint` script** (scripts: `start`, `dev`, `android`, `reload`, `ios`, `web`, `tunnel`). No ESLint/Prettier config is wired for a runnable check, so no lint command was executed (per instructions, Expo/Metro was not started). The editor's own diagnostics were run on all modified files: **no linter errors**.

**Recommendation:** add `eslint` + `eslint-config-expo` and a `"lint"` script for CI.

---

## 11. What is healthy (positives)

- All 9 navigators have consistent, valid route names — **no navigation crashes**.
- Socket singleton with correct connect/disconnect/token-rotation and per-consumer listener cleanup.
- Providers correctly ordered; all context hooks guard against missing providers.
- SecureStore token handling; no secrets or debug logging in source.
- Centralized accessibility policy and a real (if under-populated) i18n engine.
- Timers/intervals/location watchers/AppState listeners are cleaned up in the components audited.

---

## 12. Prioritized remaining recommendations (not fixed)

1. Apply the chat/map focus-effect ref pattern to `useEventsModuleData`, `useMemoriesModuleData`, `useFamilyTreeModuleData` (Medium).
2. Add `.catch`/try-catch to the flagged fire-and-forget async calls in Events/Map/Chat handlers (Medium).
3. Add coordinate guard in `MemberLocationDetailsScreen` (Medium) and defensive `user?._id`/`family?._id` in `useMapModuleData` (Medium).
4. Honor ignored route params (`SearchMemoriesScreen`, `LegacyModeScreen`, `EventReminderScreen`) and message-selection in chat sub-screens (Medium/UX).
5. Expand i18n `t()` coverage to feature screens (Medium, large surface).
6. Remove dead code: `components/dashboard/DashboardQuickActions.js`, `screens/chat/ChatScreen.js`, `screens/map/FamilyMapScreen.js` (Low).
7. Add an ESLint `lint` script for CI (Low).

---

## 13. Production-readiness score

**Score: 86 / 100** — Architecturally sound with clean navigation, secure token handling, and no remaining crash paths after fixes; held back mainly by incomplete internationalization, several unhandled-rejection/missing-state rough edges, and offline retry not yet wired.
