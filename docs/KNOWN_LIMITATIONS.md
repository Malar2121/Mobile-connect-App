# Known limitations

Current as of commit `d2ad793`. This file describes **reality**, not intent —
if something here is fixed, delete the entry.

The previous version of this file was badly out of date: it listed join-request
approval, safe zones and offline processors as pending when all three existed.
That is exactly the failure mode this document has to avoid.

---

## Not implemented

| Item | Detail |
|---|---|
| **SUS usability study** | Prepared but not run — it needs real participants. Instrument and scoring in `SUS_EVALUATION.md`. **No score exists and none should be quoted.** |
| **Play Store publication** | Proposal §6.5 mentions publishing for Android. The app has not been submitted. |
| **Recurring events** | `Event.recurrenceRule` is stored but nothing expands it. Recurring *celebrations* do work. |
| **Invitation history / expiry UI** | Email invitations expire correctly server-side; the older shareable-code screen does not show expiry. |

## Partially implemented

| Item | What works | What does not |
|---|---|---|
| **Sinhala and Tamil** | Bundles complete and parity-tested. Login, register, dashboard, family join/create, events, poll, celebrations, consent, invitations, scanner, profile, elder screens are localised — about 27% of screens | The remaining ~59 screens are English only. Adoption is guarded by a test floor so it cannot regress |
| **QR onboarding** | Generated on-device and scannable in-app; handles invite codes and email tokens | Not verified on two physical devices — see `MANUAL_TEST_PLAN.md` |
| **Email invitations** | Full token lifecycle: hashed, single-use, expiring, revocable, email-bound. 21 tests | **No SMTP provider is configured**, so no email has actually been delivered. Set `SMTP_*` to enable |
| **Performance testing** | Bounded-read and pathology tests with recorded timings | No load testing, no production measurements — figures are from one developer machine |
| **Push notifications** | Server-side dispatch is implemented and tested | Requires Firebase credentials and a physical device; not verified end-to-end |
| **Offline support** | Banner, queue and processors are registered | Cached reads are in-memory only; no unified offline cache |

## Blocked

| Item | Blocker |
|---|---|
| **Production deployment** | The Railway service is unbound — the edge returns `x-railway-fallback: true`, meaning no app is deployed. Needs account access. The backend is verified working locally (20/20 smoke). See `DEPLOYMENT.md` |

---

## Architecture notes

- **Safe zones are orphaned on mobile.** A complete, tested backend API exists at
  `/api/safezones`, but `SafeZonesScreen` still reads and writes AsyncStorage.
  Connecting them is straightforward and worth doing.
- **The production API URL is hardcoded in five places**: `.env.production`,
  `eas.json` (twice), `src/services/api.js`, and `backend/server.js` (CORS).
  Changing hosts means changing all five.
- **Duplicate fetches.** Dashboard, family and map hooks each fetch locations
  independently. Acceptable at family scale.
- **No CI.** The test suite only runs when someone runs it.

## Testing

- **154 Jest tests** across unit, integration and performance suites, all
  passing. Statement coverage ~43%, concentrated on the security-critical paths
  (models 100%, guest and consent middleware 84–100%).
- **The mobile app has no automated tests.** It is verified by parse checks
  against the project's Babel preset, API contract tracing, and the manual
  device plan. This is a real gap, stated plainly rather than papered over.
- **No physical-device testing has been performed during development.**

## Security

- `helmet`, CORS allowlist, rate limiting, bcrypt cost 12, JWT with refresh
  rotation, family-scoped queries throughout.
- No certificate pinning on mobile.
- No device binding on refresh tokens.
- Client-side file validation is minimal; the server enforces type and size.
