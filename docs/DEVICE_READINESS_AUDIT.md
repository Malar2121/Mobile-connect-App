# Device readiness audit

**Date:** 2026-09-10 · **Commit:** `1960ce1` · **Requirements source:** `CT_2020_004.pdf` (Project Proposal, August 2025)

> Audit and preparation only. No application code, `app.json`, `.env` file or
> database was changed. Nothing here has been run on a phone — every device
> result in `DEVICE_TEST_MATRIX.md` is **NOT TESTED**.

---

## Status update — 2026-09-11 (`main` at `0430a9d`)

Sections 1–11 below are the original audit, kept as a record. **Where they
disagree with this update, this update is current.**

### Verdict

**Ready to start device testing** once the phones run Expo Go for SDK 54 and the
backend is running on the same Wi-Fi network. **No device result exists yet**, and
none may be reported until the matrix has actually been run.

### Resolved since the audit

| Audit item | Now |
|---|---|
| Blocker 3 — rate limit would cut testing short | Limits are counted per member: 2,000 reads and 300 changes per 15 minutes. Raising them for a session is no longer needed |
| Blocker 5 — no way to accept an emailed token in the app | An invitation can be pasted into Join Family (matrix INV-04 to INV-06). Delivery by email still needs SMTP |
| §4.1 — hardcoded English | The whole interface is translated (1,471 keys per language). Guards fail the build on hardcoded English, including any English phrase in the app code. Notifications are written in each member's language, and API errors are translated by code |
| §4.2 — media approval not implemented | Implemented: media waits for another adult member's approval (matrix APPR-01 to APPR-06) |
| §4.3 — no text-only stories | Stories and a shared family journal exist (matrix STORY and HIST rows) |
| §6.1 — stale `.env.development` address | `.env.development` no longer sets the API address; in development the app uses the Metro host, and `npm start` still sets the detected Wi-Fi address |
| R07, R17 — no API tests for voting or file sharing | `pollVoting` (8) and `chatFileSharing` (5) added |
| R28 — no per-family quota | Quota added (`FAMILY_MEDIA_QUOTA_MB`). Videos are still not compressed |

### Found and fixed before any phone run

These would have failed on a phone. They were caught by static analysis and new
tests, not by a device:

- `t()` called at module level in eight loaded files — the file throws as soon as it is imported
- Create Event shadowed the translator, so submitting the form threw
- Person Profile used `<Card>` without importing it
- Five quick actions and the family stat cards navigated to translated text, which fails outside English
- Relationship nicknames were translated, breaking matching across languages
- A mention added by editing a message was never notified
- An oversized upload returned 500 instead of "That file is too large"
- Voice messages carried a random waveform

31 source files the app never loaded were removed, and the Android bundle builds
(`npx expo export --platform android`). The backend suite passes 279 of 279 tests
(`TEST_REPORT_FINAL.md`).

### Still blocked

| Blocker | Rows |
|---|---|
| Expo Go for SDK 54 must be installed on both phones (blocker 1) | All |
| The backend must be running and reachable from the phones (blocker 2) | All |
| Firebase credentials and a native build (blocker 4) | NOTIF-02, NOTIF-03, NOTIF-04, MENT-05 |
| SMTP provider (blocker 5, delivery only) | INV-02, INV-03 |

---

## 1. Verdict — NOT READY

| # | Blocker | Evidence | Resolution (yours) |
|---|---|---|---|
| 1 | Phones cannot open the app with store Expo Go | expo.dev/go lists **SDK 57** as current; the project is Expo **SDK 54.0.35**. Expo publishes Expo Go 54.0.8 for Android | Uninstall store Expo Go on both Android phones; install Expo Go for SDK 54 from expo.dev/go → "See all available versions". iPhones cannot be used |
| 2 | Backend is not running | `http://localhost:5000/health` and `http://192.168.8.115:5000/health` gave no response; nothing listening on port 5000 | Start it (§10); open `/health` in each phone's browser |
| 3 | API rate limit will cut testing short | `RATE_LIMIT_MAX=100` per 15 min per IP; screens refetch 2–7 endpoints every time they gain focus (§4.5) | For the local test session, raise `RATE_LIMIT_MAX` and set `AUTH_RATE_LIMIT_MAX` in `backend/.env`, then restart |
| 4 | Push notification rows cannot run | Push registration is skipped in Expo Go on Android (`usePushNotifications.js`); no `google-services.json`; `FIREBASE_*` unset | Firebase plus a new native build — later phase. 4 rows BLOCKED |
| 5 | Email invitation delivery and acceptance rows cannot run | `SMTP_*` unset (deferred); no deep-link scheme; Join Family accepts invite codes only; an emailed token can only be accepted by scanning it as a QR | SMTP phase plus an acceptance path. 3 rows BLOCKED |

Once 1–3 are done, the remaining 107 matrix rows can be executed with no code change.

---

## 2. PDF requirements that need application behaviour

✅ yes · ⚠️ partial · ❌ no

| ID | Requirement (proposal §) | In code? | Automated test? | Real device? | Two devices? | External service? | Evidence needed |
|---|---|---|---|---|---|---|---|
| R01 | Individual logins (Obj 1, §8) | ✅ | ✅ `auth` (13) | Yes | No | — | Register, sign-in, wrong-password screenshots |
| R02 | Secure invite-only family groups (Obj 1, §6.3) | ✅ | ✅ `familyIsolation`, `emailInvitations` | Yes | Yes | — | Both phones after join; member list |
| R03 | QR code onboarding (§5.2, §6.3) | ✅ generate and scan | ⚠️ QR parsing only (`inviteLink` 15); camera not automatable | Yes (camera) | Yes | — | Photo of phone 2 scanning phone 1; joined screen |
| R04 | Email onboarding (§6.3) | ⚠️ token lifecycle ✅; no in-app path to accept an emailed token | ✅ `emailInvitations` (21) | Yes | Yes | SMTP (deferred) | Received email; joined screen |
| R05 | Role-based access: admin, member, guest (§6.2, §8) | ✅ (plus parent, child) | ✅ `guestRole` (8); role escalation in `auth` | Yes | Yes | — | Role badge; refused guest writes |
| R06 | Create events (§6.3) | ✅ | ⚠️ indirect (isolation, guest, notes suites) | Yes | Yes (sync) | — | Event on both phones |
| R07 | Share availability / polling (Obj 2, §6.3) | ✅ | ⚠️ algorithm only; no Jest suite for the vote API | Yes | Yes | — | Vote counts on both phones |
| R08 | Smart Date Suggestion (§1.3, §6.3) | ✅ server-ranked, shown on the poll card | ✅ `smartDate` (13) | Yes | Yes | — | Poll card before and after a "No" vote |
| R09 | Celebration calendar: birthdays, anniversaries, cultural events (Obj 3, §6.3) | ✅ | ✅ `celebrations` (15), `celebrationsAndReminders` (14) | Yes | No | — | Celebrations list |
| R10 | Automatic reminders (Obj 3, §1.3) | ✅ hourly sweep → in-app notifications | ✅ fires once, at the offset | Yes | Yes (birthday person excluded) | — | Notifications screen on another member's phone |
| R11 | Reminders sent through FCM (§5.1, §6.3) | ⚠️ server dispatch ✅; device registration skipped in Expo Go Android; Firebase not configured | ❌ | Yes (native build) | Yes | Firebase | Push banner with the app closed |
| R12 | Memory archive — photos (Obj 4, §6.3) | ✅ gallery and camera | ❌ upload not automated | Yes | Yes | Cloudinary (ping OK) | Upload on one phone, visible on the other |
| R13 | Memory archive — short videos (§6.3) | ✅ picker 60–120 s; 10 MB server cap | ❌ | Yes | Yes | Cloudinary | Playback; clip file size |
| R14 | Stories and event notes (Obj 4, §6.3) | ⚠️ captions and event comments; no text-only story | ✅ `eventNotes` (8) | Yes | Yes | — | Caption and note on the other phone |
| R15 | Real-time chat (Obj 5, §6.3) | ✅ Socket.IO | ⚠️ live harness `scripts/qaSocketTest.js`, not in Jest | Yes | Yes | — | Screen recording of both phones |
| R16 | Mentions (§6.3) | ✅ resolved on send and on edit | ✅ `mentions` (10) | Yes | Yes | Push optional | Highlighted mention; notification entry |
| R17 | File sharing (§6.3) | ✅ image, video, PDF, DOC up to 10 MB | ❌ | Yes (pickers) | Yes | Cloudinary | File opened on the receiving phone |
| R18 | Pinned messages (§6.3) | ✅ live via `message_updated` | ⚠️ cross-family pin refused (`familyIsolation`) | Yes | Yes | — | Pinned bar on both phones |
| R19 | English, Sinhala, Tamil (Obj 6, §6.3) | ⚠️ 784 keys × 3 with full parity; literal English remains (§4.1) | ✅ `i18nBundles` (14), `i18nUsage` (4) | Yes (rendering, input) | No | — | Screenshots per language |
| R20 | Elder Mode: large fonts, larger UI, minimal navigation (Obj 6, §5.2, §5.5, §6.3) | ✅ | ⚠️ reachability only (`navigationReachability`) | Yes | No | — | Standard vs elder screenshots; task timings |
| R21 | Voice prompts (§6.3) | ✅ `expo-speech`, Elder Mode only, `en-US` / `ta-LK` / `si-LK` | ❌ | Yes (audio) | No | Phone text-to-speech voices | Screen recording with sound |
| R22 | Data visible only to the family group (Obj 7, §6.3, §8) | ✅ family-scoped queries, per-family socket rooms | ✅ adversarial `familyIsolation` (13) | Yes | Yes (two families) | — | Family B phone shows no Family A data |
| R23 | JWT authentication (§5.1, §6.3) | ✅ access and refresh tokens in SecureStore | ✅ `auth` | Partly (session persistence) | No | — | Still signed in after force-quit |
| R24 | Encrypted storage (§5.1, §6.3, §8) | ⚠️ tokens in SecureStore, bcrypt passwords; local MongoDB not encrypted at rest; Cloudinary URLs unsigned | ❌ | No — configuration and code review | No | MongoDB Atlas (encryption at rest) | Configuration note |
| R25 | Parental consent for child accounts (§6.3, §8) | ✅ | ✅ `parentalConsent` (12) | Yes | Yes | — | Child blocked, then approved |
| R26 | **Members approve shared photos and videos (§8)** | ❌ **not implemented** | ❌ | Not testable | — | — | — |
| R27 | Android prioritised (§6.3) | ✅ Android package configured | — | Yes (Android phones) | — | — | Device model and Android version on every result |
| R28 | Media compression and quotas (§5.5) | ⚠️ image quality 0.85 and Cloudinary `quality:auto`; 10 MB per file; no video compression; no per-family quota | ❌ | Yes (large video) | No | Cloudinary | Error shown for a clip over 10 MB |
| R29 | Usability, performance, real-world adoption (Obj 8, §6.4 SUS, §5.2 pilot) | ⚠️ SUS instrument prepared, not run; backend performance tests only | ⚠️ `apiPerformance` (12) | Yes | Yes | Real participants | Not this phase — no SUS results created |
| R30 | Backend hosted in the cloud (§6.5) | ❌ Railway unbound (re-checked today) | — | — | — | Hosting account | Not this phase |
| R31 | Play Store publication (§6.5) | ❌ | — | — | — | Google Play Console | Not this phase |

**Dark mode is not a PDF requirement.** It is in the matrix only because it was requested; the app offers light, dark, system and high-contrast themes.

**Excluded — not application behaviour:** interviews, surveys and MoSCoW (§6.1); architecture and database design (§6.2); timeline (§7); the Jest unit and integration requirement itself (§6.4, met by the backend suite); documentation and maintenance (§6.6).

**In the app but outside the PDF, and not in the matrix:** maps and location, SOS, safe zones, family tree, legacy profiles, 2FA, voice messages, starred messages.

---

## 3. Automated verification

**Reported by the previous phase, not re-run here:** 200/200 Jest tests; 90/90 live authorisation assertions; 332/332 mobile files parse. Jest was not re-run because its setup deletes every collection in `family_connect_test`.

**Re-verified read-only in this audit:**

| Check | Result |
|---|---|
| i18n bundles | en / si / ta: 784 leaf keys each; 0 missing, 0 extra |
| Screen files | 81 |
| MongoDB | Windows service `MongoDB` running; listening on 127.0.0.1:27017 |
| Local database `family_connect` | 281 users, 129 families, 22 events, 16 polls, 8 memories, 110 messages, 20 celebrations, 0 parental consents, 0 invitations; demo family "Connect Family" present |
| Cloudinary | `api.ping()` → ok |
| Backend | Not running |
| Railway | 404 with `server: railway-hikari` and `x-railway-fallback: true` — still no service bound |
| Firebase, SMTP | Not configured |
| Toolchain | Node 24.16.0, npm 11.13.0, Expo SDK 54.0.35, JDK 21, Android SDK and adb (no device attached), EAS CLI installed |
| PC network | Wi-Fi 192.168.8.115, profile Public; `node.exe` inbound allowed on Public |

---

## 4. Findings that change the reported state

### 4.1 Hardcoded English is still present

The reported "0 hardcoded user-facing English strings" does not hold. A heuristic scan
(JSX text, string-literal `title` / `label` / `placeholder` props, and `label:` / `title:`
object literals not passed through `t()`) finds about 200 candidate lines in about 50
screen and component files. Some will be false positives. These were confirmed by reading
the source:

| File | Shown in English whatever the language |
|---|---|
| `screens/events/EditEventScreen.js` | Field labels Title, Description, Date, Location; placeholder YYYY-MM-DD |
| `screens/events/CreateEventScreen.js` | "Category", "Privacy", "Step N of M — …", step chips, recurrence labels |
| `screens/events/AgendaScreen.js` | Header "Agenda"; filters Upcoming / Today / Past |
| `components/events/PollCard.js` | Every Smart Date reason and confidence sentence |
| `screens/chat/ChatHomeScreen.js` | Quick access: Search, Media, Files, Pinned, Starred, Voice, Settings |
| `screens/chat/SharedFilesScreen.js` | Images, Videos, Documents, Audio, "N files", "No … yet" |
| `screens/chat/ChatSettingsScreen.js` | "Notifications", "Chat", "Wallpaper" |
| `components/chat/ChatActionSheet.js` | "Unpin", "Unstar" |
| `screens/dashboard/ChildDashboardScreen.js` | "Messages" |
| `screens/auth/RegisterScreen.js` | Toast "Account created" and its message |
| `screens/auth/TwoFactorAuthScreen.js` | "Verify" |
| `screens/memories/LegacyModeScreen.js`, `StoryTimelineScreen.js` | "Preserve their story forever", "Biography", "Timeline" |

Highest candidate counts per file: `EventDetailsScreen` 14, `PersonProfileScreen` 10,
`MemberLocationDetailsScreen` 8, `ChatHomeScreen` 7, and the `*QuickActions` components 5–7 each.

**Server-generated text is English in every language:** notification titles and bodies
(for example the reminder "… is tomorrow") and server messages shown verbatim in toasts and
errors (join-request result, scan and join failures).

### 4.2 Proposal §8 media consent is not implemented

§8 states that members approve shared photos and videos. `backend/models/Memory.js` has no
approval or status field and there is no approval route; uploads are visible to the family
immediately. This cannot be device-tested until it exists.

### 4.3 "Stories" is only partly covered

Objective 4 lists photos, videos and stories. Memories are an image or video with a
caption; event notes exist as event comments. There is no text-only story.

### 4.4 Real-time scope is narrower than the manual plan assumes

Socket events exist for chat (`new_message`, `message_updated`, `message_deleted`, typing,
read) and for member-type, location, SOS and safe-zone changes. **Events, RSVPs, polls and
votes, memories, celebrations, consent decisions and join requests reach the other phone
only when a screen regains focus or is pulled to refresh.** The matrix expected results say so.

### 4.5 The rate limit will interrupt manual testing

`/api/*` allows 100 requests per 15 minutes per IP. Module hooks refetch whenever their
screen gains focus: dashboard 5 endpoints, family module 7, memories 4, events 3, chat 2–3.
About twenty screen visits in fifteen minutes exhaust the allowance, after which every call
returns HTTP 429. Login and register are limited to 20 per 15 minutes by default, which
matters when switching accounts on one phone. A 429 during testing is a configuration
effect, not an app defect.

### 4.6 Birthday reminders skip the birthday person

`sweepBirthdays` excludes the member whose birthday it is, so birthday reminders must be
checked on another member's phone.

### 4.7 Reminder days are counted on UTC dates

The sweep runs hourly and counts days on UTC calendar dates. Sri Lanka is UTC+05:30, so
between 00:00 and 05:30 local time the server's date is still the previous day and a
"tomorrow" reminder will not fire yet. Run reminder rows between 06:00 and 23:30 local time,
and record the date entered, when it was saved and when the notification appeared. A
reminder that says "today" or arrives a day early is a time-zone defect.

### 4.8 Token expiry cannot be tested in a session

`JWT_EXPIRE=30d`, so manual plan A6 (idle past expiry) is impractical on a phone. Expired
tokens are covered by the `auth` Jest suite.

---

## 5. Manual test plan review — `docs/MANUAL_TEST_PLAN.md`

77 rows in sections A–J, compared against the required coverage list:

| Area | Covered by | Gap or correction |
|---|---|---|
| Authentication | A1–A7 | A6 impractical (30-day token); A7 (2FA) is outside the PDF |
| Family creation and joining | B1, B5, B8 | Add invalid code and already-in-a-family |
| Invitations, QR generation | B2–B4 | — |
| QR scanning | B5–B7 | B7's fallback is a button to Join Family (codes only) |
| Email invitation | B9–B12 | B10–B12 blocked; B11 cannot be executed even with SMTP |
| Roles / RBAC | B13–B15 | Add: member cannot change roles or approve children; last-admin protection; restoring a guest |
| Child consent | I1–I7 | Needs two phones; reject path needs a second child account |
| Events | C1–C4 | C3 is not real-time; C4's "note" is a comment on Event Details |
| Availability, Smart Date | C5–C9 | C6 "counts update on both" is not real-time; add the no-votes case |
| Celebrations | D1–D5 | — |
| Reminders | D6–D7 | D6 must be read on another member's phone; UTC timing; push part blocked |
| Memories, photos, videos | E1–E6 | Add caption text; add a video over 10 MB |
| Chat | F1–F2, F9–F10 | Add keyboard behaviour |
| Mentions | F3–F5, F8 | Push part blocked |
| File sharing | F6 | Add opening the file on the receiving phone; Shared files list |
| Pinned messages | F7 | Add Pinned list and unpin |
| Notifications | F4, D6 | Add Notifications tap-through; push rows blocked |
| English | — | Add an English baseline pass |
| Sinhala, Tamil | G1–G5 | G1 and G3 are stale (assume only main journeys are localised); add Sinhala/Tamil typing, long strings, server text, known-English check |
| Elder Mode | H1, H6–H7 | Add maximum system font size; memories, chat and celebrations reachability; Elder Mode in Sinhala/Tamil |
| Voice prompts | H2–H5 | Add a phone without Sinhala or Tamil voice data |
| Dark mode | — | Missing (not a PDF requirement) |
| Family isolation | J1, J4 | J4 is a code-review item, not a phone test |
| Guest restrictions | B14–B15, J2 | Add memory upload, celebration and poll vote as guest |
| Performance (Obj 8) | — | Missing: cold start, chat scroll, gallery load, upload time (observations only) |

All of this is folded into `docs/DEVICE_TEST_MATRIX.md`. The original plan was not edited.

**Other documents now out of date (not edited):** `README.md` and `docs/KNOWN_LIMITATIONS.md`
(about 27% of screens localised, 154 tests), `docs/TEST_REPORT_FINAL.md` (170 tests at `d2ad793`).

---

## 6. Mobile device readiness

### 6.1 API base URL

`src/services/api.js` uses, in order:

1. `EXPO_PUBLIC_API_URL`, if set
2. `http://localhost:5000` when `NODE_ENV` is development
3. `https://mobile-connect-app-production.up.railway.app`

Socket.IO connects to the same origin (`src/socket/socketClient.js`, websocket transport, JWT in the handshake).

| Source | Value | For a physical phone |
|---|---|---|
| `npm start` → `scripts/phone-expo.ps1` | `http://<detected Wi-Fi IPv4>:5000` — today `http://192.168.8.115:5000` | ✅ correct |
| `.env.development` | `http://192.168.1.6:5000` | ❌ stale — used if you run `npx expo start` directly |
| `.env.production`, `eas.json` preview and production | Railway URL | ❌ no service bound |
| Fallback | `http://localhost:5000` | ❌ on a phone, localhost is the phone itself |

The phone must be on the same Wi-Fi as the PC, on a network without client isolation, and
able to open `http://192.168.8.115:5000/health` in its browser. `npm start` re-detects the
PC's address on each launch; `.env.development` does not.

### 6.2 Runtime on the phone

| Option | Status |
|---|---|
| Expo Go from Play Store or App Store | ❌ SDK 57 — will not open an SDK 54 project |
| **Expo Go for SDK 54 on Android (from expo.dev/go)** | ✅ recommended. Camera, image and document pickers, speech, secure store and Socket.IO all work. **No remote push** |
| iPhone | ❌ would need an EAS development build and an Apple developer account |
| `android/app/build/outputs/apk/debug/app-debug.apk` (16 Jul) | ❌ do not use — built before `expo-camera`, `expo-speech`, `react-native-svg` and `react-native-qrcode-svg` were added on 8 Sep |
| New local native build (`npx expo run:android`) | ⚠️ later, for push. Two earlier Gradle runs died with JVM out-of-memory (`android/hs_err_pid*.log`) |
| EAS `development` profile | ⚠️ `expo-dev-client` is not installed |
| EAS `preview` or `production` APK | ❌ points at Railway; the release manifest has no cleartext HTTP, so it cannot reach a local `http://` backend |

`android/` is committed, so native builds use its manifest; `app.json` plugin and permission
settings are not re-applied to it automatically.

### 6.3 Permissions

| Permission | Used for | Expo Go (SDK 54) | Native manifest |
|---|---|---|---|
| Camera | QR scan, camera photo | Prompted by Expo Go | `CAMERA` ✅ |
| Photos and media | Gallery upload, file sharing | Prompted by Expo Go | `READ_EXTERNAL_STORAGE` ✅ |
| Notifications | Push | Not requested — push is skipped in Expo Go Android | `POST_NOTIFICATIONS` via `expo-notifications` ✅ |
| Microphone | Not needed for voice prompts (speech output); only voice messages, outside the PDF | — | `RECORD_AUDIO` ✅ |
| Location | Maps, outside the PDF | Prompted | ✅ |

`screens/events/EventReminderScreen.js` imports `expo-notifications` statically; Expo Go on
Android may log a push-support warning at launch. Record it — it is not a crash.

### 6.4 app.json

Untouched. Your only uncommitted change is the blank line after `"expo": {`. Nothing in this
phase requires changing it. Separately, the Google Maps API key in `app.json` is committed to
git — restrict it to the Android package in Google Cloud Console (maps are outside the PDF).

---

## 7. Backend readiness

| Item | State |
|---|---|
| Node | 24.16.0 (18 or newer required) ✅ |
| MongoDB | Local service running; `MONGO_URI=mongodb://127.0.0.1:27017/family_connect` ✅ |
| JWT | `JWT_SECRET` and `JWT_REFRESH_SECRET` set; access 30 d, refresh 90 d ✅ |
| Socket.IO | Same port as REST; JWT handshake; per-family rooms ✅ |
| Cloudinary | Configured; ping OK ✅ |
| Firebase Admin | Not configured — push disabled and logged ❌ (push rows only) |
| SMTP | Not configured — invitations created but not emailed ❌ (deferred) |
| Reminder scheduler | Starts with the server, hourly ✅ |
| Listening address | `server.listen(PORT)` with no host → all interfaces; reachable on the LAN once running |
| CORS | React Native sends no `Origin` header → allowed |
| Rate limits | 100 per 15 min per IP on `/api/*`; 20 per 15 min on login and register ⚠️ |
| Seed data | Demo family exists; `npm run seed:demo` tops it up. **Do not run** `seed:demo:reset` (deletes the demo family's events, polls, memories, messages, locations and notifications) or `seed:dev-user` (resets that account's password) |
| Tests | `npm test` clears all collections in `family_connect_test` only (name-guarded), never `family_connect` |
| Secrets | `backend/.env` is untracked ✅. It holds a commented-out Atlas connection string with credentials — keep it untracked |

---

## 8. External services

| Service | Needed for | State | Blocks |
|---|---|---|---|
| MongoDB (local) | Everything | Running ✅ | — |
| Cloudinary | Photos, videos, chat files | Credentials valid ✅ | — |
| Firebase Cloud Messaging | Push for reminders and mentions | Not configured ❌ | 4 push rows |
| Expo push service | Delivery to Expo push tokens | Needs FCM credentials in EAS and a native build ❌ | Same rows |
| SMTP | Email delivery | Not configured — deferred | 3 email rows |
| Railway / Render / AWS | Hosted backend | Railway unbound — not this phase | Nothing in local testing |
| Google Play Console | Publication (§6.5) | Not this phase | — |
| Phone text-to-speech voices | Sinhala and Tamil prompts | Unknown per phone | Outcome of VOICE-02 |

---

## 9. REQUIRES PHYSICAL DEVICE TESTING

None of the following can be verified by Jest, parse checks or static analysis.

| Area | What to watch |
|---|---|
| Sinhala rendering | `Inter` has no Sinhala glyphs, so Android falls back to a system font — clipped vowel signs, uneven line height |
| Tamil rendering | Same fallback; Tamil strings are the longest |
| Long translated strings | Chips, buttons, poll card, step header, elder dashboard |
| Keyboard | `adjustResize`; chat input and form fields stay visible; Sinhala and Tamil Gboard input |
| Scrolling | Chat history, memory gallery, long settings pages, pull-to-refresh |
| Camera QR scanning | Focus, glare, distance, brightness of the phone showing the code |
| Push notifications | Blocked — Firebase and a native build |
| Voice prompts | `si-LK` and `ta-LK` voice availability, volume, interruption |
| Socket.IO chat | Wi-Fi drop, backgrounding, reconnection, duplicates |
| Image and video upload | Real file sizes, the 10 MB cap, slow Wi-Fi |
| Permissions | First prompt, denial, "don't ask again" |
| Navigation gestures | Android back gesture with edge-to-edge enabled; tab bar |
| Touch targets | Standard and Elder Mode, one-handed |
| Elder Mode readability | At maximum system font and display size |
| Dark mode | Contrast on a real screen; status bar legibility |

---

## 10. Commands

Backend (terminal 1):

```bash
cd "D:/Family connect App/backend" && npm run dev
```

Check from the PC, then open the same LAN URL in each phone's browser:

```bash
curl -s http://localhost:5000/health
```

```bash
curl -s http://192.168.8.115:5000/health
```

Mobile (terminal 2) — use `npm start`, not `npx expo start`, so the current Wi-Fi address is used:

```bash
cd "D:/Family connect App/family-connect-mobile" && npm start
```

Database: the `MongoDB` Windows service is already running. Only if it stops (elevated shell):

```bash
net start MongoDB
```

Recommended for the test session only — edit `backend/.env`, then restart the backend:

```
RATE_LIMIT_MAX=1000
AUTH_RATE_LIMIT_MAX=100
```

---

## 11. Who can verify what

**Claude can verify automatically:** backend Jest and coverage; the live API and socket
harnesses in `backend/scripts/` against the local server; i18n parity, `t()` usage and the
hardcoded-English scan; parsing every mobile file; navigation reachability; mobile-to-backend
API contract tracing; `/health` locally and on the LAN address from the PC; Railway status;
Cloudinary credentials; reminder sweep logic; that QR codes are generated on-device
(`react-native-qrcode-svg`, no third-party QR service); optionally an Android emulator smoke
pass for layout and language rendering — not a substitute for phones.

**Only you can verify on real phones:** camera QR scanning between two phones; real-time chat
across two phones on Wi-Fi; permission prompts; Sinhala and Tamil keyboard input and
rendering; spoken prompts; Elder Mode readability and touch targets; dark mode on real
screens; uploads of real phone photos and videos; backgrounding and airplane-mode behaviour;
and later push delivery (after Firebase), email delivery (after SMTP), the SUS study and the
family pilot.
