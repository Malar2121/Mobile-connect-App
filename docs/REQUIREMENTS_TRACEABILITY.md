# Requirements traceability

**Source:** project proposal `CT_2020_004.pdf` (August 2025) · **Updated:** 2026-09-11

Every requirement the proposal states for the software and its evaluation, traced
to where it is implemented, how it is verified, and what is still outstanding.
Duplicates across sections are merged, with every section cited.

**Status values**

| Status | Meaning |
|---|---|
| COMPLETE | Implemented, and verified by automated tests or by inspection where tests do not apply |
| PARTIAL | Implemented in part; the missing part is named |
| MISSING | Not implemented |
| BLOCKED_EXTERNAL | The code is ready, but it needs an account, credential or service the repository does not have |
| REQUIRES_REAL_USER | Needs real families or participants; it cannot be produced by code |

> **No row has been verified on a physical phone yet.** "Device" says whether a
> requirement still needs a device run; the rows to run are in
> `DEVICE_TEST_MATRIX.md`.

---

## Summary

| Status | Count |
|---|---|
| COMPLETE | 33 |
| PARTIAL | 4 |
| MISSING | 0 |
| BLOCKED_EXTERNAL | 5 |
| REQUIRES_REAL_USER | 3 |
| **Total** | **45** |

- **Strict compliance:** 33 of 45 = **73%**.
- **Code-closeable compliance:** 33 of the 37 requirements that code can close = **89%**. This excludes BLOCKED_EXTERNAL and REQUIRES_REAL_USER.

---

## Family groups, roles and onboarding

| ID | Requirement | Source | Status | Implementation | Automated evidence | Device | Outstanding |
|---|---|---|---|---|---|---|---|
| REQ-01 | Individual logins | Obj 1 | COMPLETE | `/api/auth` register, login, refresh, 2FA | `auth` (13) | Needed | — |
| REQ-02 | Secure, invite-only private family groups | Obj 1, §6.3 | COMPLETE | Invite code, QR and email invitation only; families are not searchable | `familyIsolation` (13), `emailInvitations` (21) | Needed (two phones) | — |
| REQ-03 | Role-based access: admin, member, guest | §6.2, §8 | COMPLETE | Roles admin, parent, member, child, guest; `denyGuestWrites`; last-admin protection | `guestRole` (8), `pollVoting` guest case, `auth` escalation | Needed | — |
| REQ-04 | QR code onboarding | §5.2, §6.3 | COMPLETE | QR drawn on the phone (`react-native-qrcode-svg`); scanned with `expo-camera` | `inviteLink` (14), `invitePaste` (6) | Needed (two phones) | Camera scan between phones |
| REQ-05 | Onboarding by email | §6.3 | BLOCKED_EXTERNAL | Hashed, single-use, expiring, email-bound tokens; revocation; a token can be pasted into Join Family | `emailInvitations` (21), `invitePaste` (6) | Needed | No SMTP provider is configured, so no email has been delivered |

## Events, availability and Smart Date

| ID | Requirement | Source | Status | Implementation | Automated evidence | Device | Outstanding |
|---|---|---|---|---|---|---|---|
| REQ-06 | Members create events | §6.3 | COMPLETE | `/api/events` create, edit, delete, RSVP | `familyIsolation`, `guestRole`, `eventNotes` | Needed | — |
| REQ-07 | Share availability (polling) | Obj 2, §6.3 | COMPLETE | `/api/polls` create, vote, close; one vote per member per option | `pollVoting` (8) | Needed (two phones) | — |
| REQ-08 | Smart Date Suggestion | §1.3, §6.3 | COMPLETE | Server ranks by blockers, availability across the whole family, coverage, then date; states a reason and a confidence | `smartDate` (11), `pollVoting` (8) | Needed | — |

## Celebrations and reminders

| ID | Requirement | Source | Status | Implementation | Automated evidence | Device | Outstanding |
|---|---|---|---|---|---|---|---|
| REQ-09 | Celebration calendar: birthdays, anniversaries, cultural events | Obj 3, §6.3 | COMPLETE | Birthdays come from member profiles; anniversaries and cultural events are stored | `celebrations` (15), `celebrationsAndReminders` (14) | Needed | — |
| REQ-10 | Automatic reminders | Obj 3, §1.3 | COMPLETE | An hourly server sweep sends each reminder once, as an in-app notification in the member's language | `celebrationsAndReminders` (14), `notificationLanguage` (1) | Needed | — |
| REQ-11 | Reminders sent through Firebase Cloud Messaging | §5.1, §6.3 | BLOCKED_EXTERNAL | `firebase-admin` multicast and the Expo push service are implemented | — | Needed (native build) | Firebase credentials, `google-services.json`, and a native build (Expo Go on Android cannot receive remote push) |

## Memory archive

| ID | Requirement | Source | Status | Implementation | Automated evidence | Device | Outstanding |
|---|---|---|---|---|---|---|---|
| REQ-12 | Store and view family photos | Obj 4, §6.3 | COMPLETE | Upload from gallery or camera to Cloudinary; albums, captions, comments | `familyIsolation`, `memoryApproval` | Needed | — |
| REQ-13 | Short videos | §6.3 | COMPLETE | Video upload up to `MAX_FILE_SIZE_MB` (10 MB) | `memoryApproval` (metadata; upload itself mocked) | Needed | Real clip upload and playback |
| REQ-14 | Stories | Obj 4, §1.3 | COMPLETE | `/api/stories` with categories, author-or-admin editing, and a family history journal at `/api/family/history` | `storiesAndHistory` (12) | Needed | — |
| REQ-15 | Event notes | §6.3 | COMPLETE | Notes on each event, plus the family's recent notes at `/api/events/notes` | `eventNotes` (8) | Needed | — |
| REQ-16 | Members approve shared photos and videos | §8 | COMPLETE | New media stays pending until another adult member approves it; the uploader sees it, the family does not; automatic when nobody else could review | `memoryApproval` (13) | Needed (two phones) | — |
| REQ-17 | Storage costs managed by compressing media and setting quotas | §5.5 | PARTIAL | Per-family quota (`FAMILY_MEDIA_QUOTA_MB`, default 2048), checked before upload; images compressed by Cloudinary `quality:auto`; 10 MB per-file cap | `memoryApproval` quota case | — | **Videos are not compressed** |
| REQ-18 | Secure media storage | §6.3 | PARTIAL | Cloudinary; every API read is family-scoped | `familyIsolation` | — | **Delivery URLs are public and unsigned**: anyone holding a file's URL can open it |

## Chat

| ID | Requirement | Source | Status | Implementation | Automated evidence | Device | Outstanding |
|---|---|---|---|---|---|---|---|
| REQ-19 | Real-time chat | Obj 5, §6.3 | COMPLETE | Socket.IO with a JWT handshake and per-family rooms; consent and guest rules enforced on the socket | `socketAuthorization` (8) | Needed (two phones) | — |
| REQ-20 | Mentions | §6.3 | COMPLETE | `@Full Name` resolved on the server when a message is sent or edited; the person named gets their own notification | `mentions` (10), `chatMentions` (4) | Needed | — |
| REQ-21 | File sharing | §6.3 | COMPLETE | Images, video, audio and documents up to 10 MB | — (Cloudinary upload not automated) | Needed | Send and open a file on two phones |
| REQ-22 | Pinned messages | §6.3 | COMPLETE | Pin and unpin, broadcast live as `message_updated` | `familyIsolation` (cross-family pin refused) | Needed | — |

## Accessibility and languages

| ID | Requirement | Source | Status | Implementation | Automated evidence | Device | Outstanding |
|---|---|---|---|---|---|---|---|
| REQ-23 | English, Sinhala and Tamil | Obj 6, §6.3 | COMPLETE | 1,471 translation keys in each language; server notifications written in each member's language; API errors translated by code | `i18nBundles` (14), `i18nUsage` (5), `i18nHardcoded` (6), `mobileScope` (4), `notificationText` (6) | Needed (rendering, typing) | Translations have not been reviewed by a fluent Sinhala or Tamil speaker |
| REQ-24 | Elder Mode: large fonts, larger UI elements, minimal navigation | Obj 6, §5.2, §5.5, §6.3 | COMPLETE | Elder mode with scaled type and targets and a reduced tab set | `navigationReachability` (29) | Needed | — |
| REQ-25 | Voice prompts | §6.3 | COMPLETE | `expo-speech` in Elder Mode, in the chosen language | — (audio output) | Needed | Whether each phone has Sinhala and Tamil voices |

## Security and privacy

| ID | Requirement | Source | Status | Implementation | Automated evidence | Device | Outstanding |
|---|---|---|---|---|---|---|---|
| REQ-26 | JWT authentication | §5.1, §6.3, §2.1 | COMPLETE | Access and refresh tokens; refresh rotation; tokens kept in SecureStore on the phone | `auth` (13) | Partly | — |
| REQ-27 | Encrypted storage | §5.1, §6.3, §8 | PARTIAL | Passwords hashed with bcrypt; tokens in the phone's encrypted SecureStore | — | — | **No field-level encryption**; encryption at rest depends on the database host (Atlas provides it; the local development database does not) |
| REQ-28 | Parental consent for child accounts | §6.3, §8 | COMPLETE | A child account sees no family content until a guardian approves; enforced on REST and sockets | `parentalConsent` (13), `socketAuthorization` | Needed (two phones) | — |
| REQ-29 | Data visible only to the family group | Obj 7, §6.3, §8 | COMPLETE | Every query is family-scoped; another family's ids return 404; per-member rate limits | `familyIsolation` (13), `legacySecurity` (5), `rateLimit` (1) | Needed (two families) | — |

## Platform and architecture

| ID | Requirement | Source | Status | Implementation | Automated evidence | Device | Outstanding |
|---|---|---|---|---|---|---|---|
| REQ-30 | React Native, cross-platform, Android prioritised | §5.1, §6.3 | COMPLETE | Expo SDK 54; the Android bundle builds (`npx expo export --platform android`) | `mobileScope`, `navigationReachability` | Needed | iOS has not been built |
| REQ-31 | Node.js and Express backend with REST and WebSocket | §5.1, §6.3 | COMPLETE | Express API and Socket.IO on one port | Whole backend suite | — | — |
| REQ-32 | MongoDB Atlas for user and event data | §5.1, §6.3 | BLOCKED_EXTERNAL | Any MongoDB URI works through `MONGO_URI`; development uses a local MongoDB | Suite runs against local MongoDB | — | Point `MONGO_URI` at Atlas and verify from the hosting platform |
| REQ-33 | Cloudinary or AWS S3 for photos and videos | §5.1, §6.3 | COMPLETE | Cloudinary through `multer-storage-cloudinary` | Credentials checked with `api.ping()` on 2026-09-10 | Needed | — |
| REQ-34 | Database for families, members, events and albums | §6.2 | COMPLETE | Mongoose models `Family`, `User`, `Event`, `Album` and others | Model coverage in the suite | — | — |
| REQ-35 | Architecture: mobile app → API → cloud storage | §6.2 | COMPLETE | `docs/ARCHITECTURE.md` | — | — | — |

## Testing, evaluation, deployment and documentation

| ID | Requirement | Source | Status | Implementation | Automated evidence | Device | Outstanding |
|---|---|---|---|---|---|---|---|
| REQ-36 | Unit testing with Jest | §6.4 | COMPLETE | `backend/tests/unit` | See `TEST_REPORT_FINAL.md` | — | — |
| REQ-37 | Integration testing across modules | §6.4 | COMPLETE | `backend/tests/integration` against a real MongoDB | See `TEST_REPORT_FINAL.md` | — | — |
| REQ-38 | Usability evaluation with SUS | §6.4, §2.1 | REQUIRES_REAL_USER | Instrument, tasks and scoring in `SUS_EVALUATION.md` | — | — | Run with participants; **no score exists** |
| REQ-39 | Pilot and user acceptance testing with family members | §5.2, §7, Obj 8 | REQUIRES_REAL_USER | `DEVICE_TEST_MATRIX.md`, `MANUAL_TEST_PLAN.md` | — | — | Run with a family |
| REQ-40 | Test performance | Obj 8, §7 | PARTIAL | Bounded reads and response times on one machine | `apiPerformance` (12) | Needed | **No device, load or production measurements** |
| REQ-41 | Real-world adoption | Obj 8 | REQUIRES_REAL_USER | — | — | — | Needs a family using the app over time |
| REQ-42 | Backend hosted on Render or AWS | §6.5 | BLOCKED_EXTERNAL | Deployable as is (`node server.js`, platform `PORT`) | Local smoke tests | — | The Railway host returned its fallback 404 again on 2026-09-11; needs a hosting account |
| REQ-43 | Published on the Play Store | §6.5 | BLOCKED_EXTERNAL | — | — | — | Google Play Console account, signed release build, store listing |
| REQ-44 | User guides, API documentation, test reports | §6.6 | COMPLETE | `USER_GUIDE.md`, `API_REFERENCE.md`, `TEST_REPORT_FINAL.md` | — | — | — |
| REQ-45 | Maintenance with bug fixes and updates | §6.6 | COMPLETE | `MAINTENANCE.md`; regression tests added for each bug fixed | — | — | — |

---

## Proposal items that are not software requirements

Listed for completeness and **not counted** above.

| Item | Source | Note |
|---|---|---|
| Interviews and surveys with families; MoSCoW prioritisation | §6.1 | Research activities. The repository holds no record of them |
| Agile sprints within one academic year | §5.4, §7 | Project management |
| Cloud costs under LKR 3,000 a month during the pilot | §5.3 | Depends on the hosting chosen; not measured |
| Business needs: fewer missed events, one private place for memories, automated scheduling, family bonding | §1.3 | Outcomes of REQ-06–REQ-22, measurable only in a pilot (REQ-39, REQ-41) |
