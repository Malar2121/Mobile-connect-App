# Test report

Run on 2026-09-11 · `main` at `0430a9d` · Node 24.16.0, local MongoDB, Windows 11.

Proposal §6.4 requires unit testing with Jest and integration testing across
modules; Objective 8 additionally requires testing performance.

---

## Summary

| Suite type | Suites | Tests | Result |
|---|---|---|---|
| Unit (including static checks of the mobile code) | 11 | 120 | **all passing** |
| Integration | 16 | 147 | **all passing** |
| Performance | 1 | 12 | **all passing** |
| **Total** | **28** | **279** | **279 passed, 0 failed** |

```bash
cd backend && npm test
```

```bash
cd backend && npm run test:coverage
```

### Coverage

| Measure | Covered |
|---|---|
| Statements | 60.1% (1,565 of 2,602) |
| Branches | 50.1% (741 of 1,480) |
| Functions | 69.0% (216 of 313) |
| Lines | 61.8% (1,472 of 2,383) |

Coverage is highest on the rules that protect family data:

| Area | Statements |
|---|---|
| Models | 100% |
| `middleware/auth.js`, `denyGuestWrites` | 100% |
| `utils/smartDate` | 97.5% |
| `services/notificationText` | 95.8% |
| `services/memoryPolicy` | 95.7% |
| `services/accessPolicy` | 93.8% |
| `requireParentalConsent` | 88.9% |
| `pollController` | 85.9% |
| `storyController` | 85.7% |
| `consentController` | 84.4% |
| `mediaQuota` | 83.3% |
| `invitationController` | 82.6% |
| `memoryController` | 64.7% |
| `chatController` | 54.2% |
| `errorHandler` | 52.8% |

The weakest areas are chat reactions, search and stars, and the less common
error-handler branches.

---

## Unit tests (120)

| Suite | Tests | Covers |
|---|---|---|
| `smartDate` | 11 | Scoring, ranking and edge cases: no responses, conflicts, unanimity, partial availability, past dates, empty polls, ties, zero family size |
| `celebrations` | 15 | Recurrence maths including 29 February in leap and non-leap years, one-off expiry, age at occurrence, birthdays derived from profiles |
| `mentions` | 10 | Longest-name matching, prefix rejection (`@Amma` vs `Ammar`), duplicates, regex characters in names, non-Latin scripts |
| `inviteLink` | 14 | QR parsing for codes and tokens, bare and in links, and rejection of unrelated QR codes |
| `invitePaste` | 6 | Finding an invitation token or family code in pasted text |
| `notificationText` | 6 | Every notification type written in English, Sinhala and Tamil, with members' own words kept as written |
| `i18nBundles` | 14 | en/si/ta key parity, placeholder parity, script presence, no empty values, no copied English |
| `i18nUsage` | 5 | Every `t()` and `translate()` key exists; every file calling `t()` obtains it; localised-screen floor (82 of 83) |
| `i18nHardcoded` | 6 | No English in JSX text, user-facing props and keys, alerts, toasts or template literals, and **no English phrase anywhere** in loaded code; two self-tests |
| `mobileScope` | 4 | No undefined names, no shadowed translator, no translated text used as a route name or stored value; three self-tests |
| `navigationReachability` | 29 | Elder Mode reaches events, celebrations, memories and the family tree with four large tabs; Child Mode reaches profile, language, security, notifications and joining, but never family management or the tree; the consent banner, without self-approval; no "TODO" or "Coming soon" text shown to members |

### Static checks of the mobile app

The React Native app has no test runner. Instead, `mobileScope`, `i18nHardcoded`,
`i18nUsage` and `navigationReachability` parse **every mobile source file** (305
under `src/`, plus `App.js` and `index.js`) with Babel and check them without
running them. The Android bundle is also built:

```bash
cd family-connect-mobile && npx expo export --platform android --output-dir ../../expo-export-check
```

It completed successfully on 2026-09-11 after the last mobile change.

## Integration tests (147)

Run with supertest against a real MongoDB whose name must contain `test`; setup
refuses to run otherwise, because it drops collections between files. Cloudinary
is replaced by in-memory storage where files are uploaded.

| Suite | Tests | Covers |
|---|---|---|
| `auth` | 13 | Registration, duplicate email, password rules, role escalation refused, login, wrong password, NoSQL injection, missing/forged/expired tokens |
| `familyIsolation` | 13 | **Adversarial.** Family B attempts to read, fetch by id, edit, delete and pin family A's events, messages and celebrations, and to change a role in another family |
| `legacySecurity` | 5 | Legacy (remembrance) profiles: the family reads them, guests cannot leave tributes, unapproved minors are blocked, another family's profile is hidden, only an admin creates one |
| `socketAuthorization` | 8 | Socket.IO: messages reach the family live and never another family; guests cannot send or type; an unapproved minor stays out of the room until a guardian approves; a role change after connecting applies; an invalid token is rejected |
| `rateLimit` | 1 | Limits are counted per member, so one member cannot exhaust another's allowance |
| `parentalConsent` | 13 | Minor gated across endpoints, own status readable while blocked, guardian queue, approve/reject, self-approval refused, cross-family decision refused |
| `emailInvitations` | 21 | Hashed tokens, single use, expiry, revocation, wrong-account rejection, forged tokens, admin-role refusal, cross-family isolation, honest delivery reporting |
| `guestRole` | 8 | Guest reads succeed, every write refused, SOS still available, last-admin protection |
| `pollVoting` | 8 | No-votes suggestion, availability against the whole family, vote replacement, validation, isolation, closing rules, deadlines, guests |
| `celebrationsAndReminders` | 14 | Celebration CRUD and permissions; reminders fire at their offset, not before, and never twice |
| `eventNotes` | 8 | Create, list, ordering, the family's recent notes, cross-family isolation, guest read-only |
| `memoryApproval` | 13 | Pending until another member approves; uploader sees it, the family does not; no self-review; guests and children cannot review; automatic approval with no other reviewer; rejection reasons; quota refusal |
| `storiesAndHistory` | 12 | Stories CRUD, validation, author-or-admin editing, Sinhala and Tamil text preserved, guest read-only; the family history journal |
| `chatMentions` | 4 | A mention notifies the person named once; names from another family are ignored; an edit notifies only people it newly mentions; only the sender edits |
| `chatFileSharing` | 5 | Photos with captions, documents, video and voice notes; empty and oversized messages; guests; family isolation |
| `notificationLanguage` | 1 | A member's chosen language is stored and their notifications are written in it |

---

## Performance (12)

The proposal states **no numeric performance target**, so none has been
invented. These tests assert two defensible things: that reads stay **bounded**
as data grows, and that nothing shows a **pathological** delay (a missing index,
an accidental N+1). The ceiling is 2,000 ms — a tripwire, not a latency claim.

### Bounded reads

| Test | Result |
|---|---|
| Chat capped at the requested limit with 120 messages stored | 50 returned, `hasMore: true` |
| Server-side maximum enforced when a client asks for 100,000 | Clamped to 200 or fewer |
| Albums paginated with 25 stored | 10 or fewer returned, total reported |
| Required indexes declared | `Message{familyId,createdAt}`, `Celebration{familyId,date}`, `Invitation.tokenHash` |

### Measured response times

Single developer machine, local MongoDB, no network. **Observations, not
thresholds.**

| Endpoint | Time |
|---|---|
| `GET /api/memories` | 6 ms |
| `GET /api/notifications` | 6 ms |
| `GET /api/family/my-family` | 9 ms |
| `GET /api/celebrations` (incl. derived birthdays) | 9 ms |
| `GET /api/albums?limit=10` (25 stored) | 9 ms |
| `GET /api/events` | 10 ms |
| `GET /api/family-tree` | 10 ms |
| `GET /api/chat/messages` | 14 ms |
| `GET /api/chat/messages?limit=50` (120 stored) | 18 ms |
| 10 concurrent `GET /api/events` | 52 ms total |

All family-scoped reads complete in tens of milliseconds and do not degrade with
stored volume, because they are index-backed and bounded. **These figures do not
describe production** and should not be quoted as such.

---

## Bugs found and fixed by these checks

### This phase

1. **`t()` called at module level in eight loaded files** (family and tree quick
   actions, chat home and attachments, agenda, create event, family permissions,
   live map). The call throws when the file is imported. Found by `mobileScope`.
2. **Create Event shadowed the translator** with the trimmed title, so submitting
   threw "t is not a function". Found by `mobileScope`.
3. **Person Profile rendered `<Card>` without importing it.** Found by `mobileScope`.
4. **Translated route names.** Calendar, Celebrations, Agenda, Ancestors,
   Descendants and the family stat cards navigated to translated text, which only
   matched a screen name in English.
5. **Translated relationship nicknames.** They are stored and matched, so a
   relationship saved in one language stopped matching in another.
6. **A mention added by editing a message was never notified.** Populating the
   message replaced the ids with user objects before the new mentions were worked
   out. Found by `chatMentions`.
7. **An oversized upload returned 500**, so the app showed a generic error instead
   of "That file is too large". Found by `chatFileSharing`.
8. **Voice messages carried a random waveform** that the server stored as if it
   described the recording. Removed.
9. **English left in the interface** — poll explanations, RSVP labels, fallback
   names, units, form defaults — found by the phrase rule and translated.
10. **A duplicate invite-code index** made Mongoose warn on every start.

### Earlier

1. **`getAlbums()` shape** — `albums.slice()` would have crashed the Memories tab.
2. **Join-request bypass** — the first fix still accepted a bare `familyId`.
3. **Missing i18n hooks** — two screens called `t()` without obtaining it.
4. **Duplicate imports** — a re-run migration produced a syntax error.

---

## What is *not* covered

Stated plainly:

- **No physical-device testing** has been performed. `DEVICE_TEST_MATRIX.md` is
  ready and entirely NOT TESTED.
- **No automated tests run the app** on a device or emulator; the mobile code is
  checked statically and by building the bundle.
- **Real uploads to Cloudinary** are not exercised by the suite.
- **No end-to-end push-notification test** — that needs Firebase and a native build.
- **No load, soak or production measurements**, because there is no live deployment.
