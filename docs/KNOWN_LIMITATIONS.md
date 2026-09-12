# Known limitations

Current as of 2026-09-11. This file describes **reality**, not intent — if
something here is fixed, delete the entry. Requirement-by-requirement status is
in `REQUIREMENTS_TRACEABILITY.md`.

---

## Not implemented

| Item | Detail |
|---|---|
| **Video compression** (§5.5) | Images are compressed by Cloudinary (`quality:auto`); videos are stored as uploaded, up to 10 MB. The per-family quota does exist |
| **Signed media URLs** (§6.3 secure storage) | Every API read is family-scoped, but Cloudinary delivery URLs are public: anyone holding a file's URL can open it |
| **Field-level encryption** (§5.1, §8) | Passwords are hashed and tokens are kept in SecureStore on the phone. Stored documents are not encrypted by the app; encryption at rest depends on the database host |
| **Recurring events** | `Event.recurrenceRule` is stored but nothing expands it. Recurring *celebrations* do work |
| **Play Store publication** (§6.5) | Not submitted |

## Blocked on external services

| Item | Blocker |
|---|---|
| **Production deployment** (§6.5) | The Railway host still returns its edge fallback 404 (`x-railway-fallback: true`, re-checked 2026-09-11): no service is bound. Needs the account owner. See `DEPLOYMENT.md` |
| **Push notifications** (§5.1, §6.3) | Server dispatch through Firebase Admin and the Expo push service is implemented. Needs Firebase credentials, `google-services.json` and a native build — Expo Go on Android cannot receive remote push. In-app notifications work without it |
| **Email delivery** | The invitation token lifecycle is complete and tested, and a token can be pasted into Join Family. **No SMTP provider is configured**, so no email has actually been delivered |
| **MongoDB Atlas** | The app works with any `MONGO_URI`. Development and tests use a local MongoDB; a connection to Atlas has not been verified in this phase |

## Needs real people or real phones

| Item | Detail |
|---|---|
| **Physical-device testing** | None has been performed. `DEVICE_TEST_MATRIX.md` lists every row as NOT TESTED |
| **SUS usability study** (§6.4) | Prepared, not run. **No score exists and none should be quoted** |
| **Family pilot and adoption** (§5.2, Obj 8) | Not run |
| **Translation review** | The Sinhala and Tamil text has not been reviewed by a fluent speaker |
| **Script rendering** | Inter has no Sinhala or Tamil glyphs; Android falls back to a system font. Clipping and line height are unverified |
| **Voice prompts** | Sinhala and Tamil speech depends on the voices installed on each phone |

## Partially implemented

| Item | What works | What does not |
|---|---|---|
| **Performance testing** | Bounded reads and response times recorded by the backend suite | No load testing, no device or production measurements — figures come from one developer machine |
| **Real-time updates** | Chat messages, edits, deletions, pins, typing, read receipts, location and SOS arrive live | Events, RSVPs, polls, memories and their approval, celebrations, stories, consent decisions and join requests refresh when a screen regains focus or is pulled down |
| **Family privacy settings** | The Family → Privacy screen saves preferences | They are stored **on that phone only** and are not enforced by the server. The server's own rules (family scoping, roles, consent, media approval) are what protect data |
| **Invite activity and family motto** | Shown on the Family screens | Stored on the phone only |
| **Offline support** | Banner, queue and processors are registered | Cached reads are in memory only; there is no unified offline cache |

---

## Architecture notes

- **The production API URL is hardcoded in five places**: `.env.production`,
  `eas.json` (twice), `src/services/api.js`, and `backend/server.js` (CORS).
  Changing hosts means changing all five.
- **Reminder days are counted on UTC dates.** In Sri Lanka (UTC+05:30) a
  "tomorrow" reminder does not fire between 00:00 and 05:30 local time.
- **Birthday reminders skip the person whose birthday it is.** This is intended.
- **Duplicate fetches.** Dashboard, family and map hooks each fetch locations
  independently. Acceptable at family scale.
- **No CI.** The test suite only runs when someone runs it.

## Testing

- The backend suite (unit, integration and performance) passes; counts and
  coverage are in `TEST_REPORT_FINAL.md`.
- **The mobile app is checked statically, not run.** The backend suite analyses
  every mobile source file (undefined names, shadowed translators, translated
  route names, hardcoded English, translation keys, navigation reachability),
  and the Android bundle builds. Nothing exercises the app on a device or
  emulator.
- Cloudinary uploads are replaced by in-memory storage in tests. Real uploads have
  been checked only by the Cloudinary credential ping.
- Push delivery has not been tested end to end.

## Security

- `helmet`, a CORS allowlist, rate limits counted per member, bcrypt, JWT with
  refresh rotation, family-scoped queries, and consent and guest rules enforced on
  both REST and Socket.IO.
- No certificate pinning on mobile.
- No device binding on refresh tokens.
- Media URLs are public (see above).
- The Google Maps API key in `app.json` is committed; restrict it to the Android
  package in Google Cloud Console.
- Client-side file validation is minimal; the server enforces type, size and the
  family quota.
