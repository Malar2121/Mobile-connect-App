# Test report

Commit `d2ad793` · backend suite run on Node 24, MongoDB 7 (local), Windows 11.

Proposal §6.4 requires unit testing with Jest and integration testing across
modules; Objective 8 additionally requires testing performance.

---

## Summary

| Suite type | Suites | Tests | Result |
|---|---|---|---|
| Unit | 6 | 71 | **all passing** |
| Integration | 7 | 87 | **all passing** |
| Performance | 1 | 12 | **all passing** |
| **Total** | **14** | **170** | **170 passed, 0 failed** |

```bash
cd backend && npm test
```

Statement coverage is ~43% overall and is deliberately concentrated on the
security-critical paths rather than spread thin to inflate the number:

| Area | Statements |
|---|---|
| Models | 100% |
| `denyGuestWrites` | 100% |
| `auth` middleware | 100% |
| `requireParentalConsent` | 85% |
| `consentController` | 84% |

---

## Unit tests (71)

| Suite | Tests | Covers |
|---|---|---|
| `smartDate` | 13 | Scoring, ranking, and every edge case: no responses, a single response, conflicts, unanimity, partial availability, past dates, empty polls, ties, zero family size |
| `celebrations` | 15 | Recurrence maths including 29 February in leap and non-leap years, one-off expiry, age at occurrence, birthdays derived from profiles |
| `mentions` | 10 | Longest-name matching, prefix rejection (`@Amma` vs `Ammar`), duplicates, regex characters in names, non-Latin scripts |
| `inviteLink` | 15 | QR parsing for codes and tokens, bare and in links, and rejection of unrelated QR codes |
| `i18nBundles` | 14 | en/ta/si key parity, placeholder parity, script presence, no empty values, not-copied-English |
| `i18nUsage` | 4 | Every `t()` key exists; every file calling `t()` obtains it; localisation floor |

## Integration tests (87)

Run with supertest against a real MongoDB whose name must contain `test`;
setup refuses to run otherwise, because it drops collections between files.

| Suite | Tests | Covers |
|---|---|---|
| `auth` | 13 | Registration, duplicate email, password rules, role escalation refused, login, wrong password, NoSQL injection, missing/forged/expired tokens |
| `familyIsolation` | 13 | **Adversarial.** Family B attempts to read, fetch by id, edit, delete and pin family A's events, messages and celebrations, and to change a role in another family |
| `parentalConsent` | 12 | Minor gated across six endpoints, own-status readable while blocked, guardian queue, approve/reject, self-approval refused, cross-family decision refused |
| `emailInvitations` | 21 | Hashed tokens, single use, expiry, revocation, wrong-account rejection, forged tokens, admin-role refusal, cross-family isolation, honest delivery reporting |
| `guestRole` | 8 | Guest reads succeed, every write refused, SOS still available, last-admin protection |
| `celebrationsAndReminders` | 14 | Celebration CRUD and permissions; reminders fire at their offset, not before, and never twice across repeated sweeps |
| `eventNotes` | 8 | Create, list, ordering, persistence, cross-family isolation, guest read-only |

---

## Performance (12)

The proposal states **no numeric performance target**, so none has been
invented. These tests assert two defensible things: that reads stay **bounded**
as data grows, and that nothing exhibits a **pathological** delay (a missing
index, an accidental N+1). The ceiling used is 2000 ms — an order-of-magnitude
tripwire, not a latency claim.

### Bounded reads

| Test | Result |
|---|---|
| Chat capped at the requested limit with 120 messages stored | 50 returned, `hasMore: true` |
| Server-side maximum enforced when a client asks for 100,000 | Clamped to ≤ 200 |
| Albums paginated with 25 stored | ≤ 10 returned, total reported |
| Required indexes declared | `Message{familyId,createdAt}`, `Celebration{familyId,date}`, `Invitation.tokenHash` |

### Measured response times

Workload: 5 members, 20 events, 20 celebrations, 40 messages. Single developer
machine, local MongoDB, no network. **Observations, not thresholds.**

| Endpoint | Time |
|---|---|
| `GET /api/memories` | 6 ms |
| `GET /api/notifications` | 6 ms |
| `GET /api/family-tree` | 8 ms |
| `GET /api/family/my-family` | 10 ms |
| `GET /api/events` | 10 ms |
| `GET /api/albums?limit=10` (25 stored) | 10 ms |
| `GET /api/celebrations` (incl. derived birthdays) | 11 ms |
| `GET /api/chat/messages` | 16 ms |
| `GET /api/chat/messages?limit=50` (120 stored) | 21 ms |
| 10 concurrent `GET /api/events` | 61 ms total |

Interpretation: all family-scoped reads complete in tens of milliseconds and do
not degrade with stored volume, because they are index-backed and bounded.
Concurrency of 10 costs roughly 6× a single request, which is consistent with
connection reuse rather than serialisation.

**These figures do not describe production.** They come from one machine with a
local database and no network latency, and they should not be quoted as
production performance.

---

## Bugs found and fixed by these tests

Worth recording, because they are the argument for having written them:

1. **`getAlbums()` shape** — the un-mocking dropped a `.then(r => r.albums)`
   unwrap, so `albums` became an object. `albums.slice()` would have crashed the
   Memories tab.
2. **Join-request bypass** — the first fix still accepted a bare `familyId`; the
   security test caught that the attack it was meant to block still worked.
3. **Missing i18n hooks** — two migrated screens called `t()` without
   destructuring it from `useI18n()`, which crashes when the screen opens. The
   usage test caught both.
4. **Duplicate imports** — a re-run of the migration added `useI18n` twice,
   producing a syntax error caught by the parse check.

---

## What is *not* covered

Stated plainly:

- **No automated mobile tests.** The React Native app has no test runner. It is
  verified by parsing all 332 source files against the project's Babel preset,
  by tracing every client API call to a real backend route, and by the manual
  plan in `MANUAL_TEST_PLAN.md`.
- **No physical-device testing** has been performed during development.
- **No load or soak testing.**
- **No end-to-end push-notification verification** — that needs Firebase
  credentials and a real device.
- **No production measurements**, because there is no live deployment.
