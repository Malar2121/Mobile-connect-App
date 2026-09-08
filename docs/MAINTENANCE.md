# Maintenance

Proposal §6.6: *"Maintain the system with regular bug fixes and future feature
updates."* This is the process for doing that.

---

## Before changing anything

```bash
cd backend && npm test
```

A green suite before you start means any failure afterwards is yours. If the
suite is already red, fix that first — never build on a broken baseline.

---

## Fixing a bug

1. **Reproduce it**, and write the reproduction down.
2. **Write a failing test first.** For anything server-side this is not
   optional: a bug without a test comes back. Put it in
   `backend/tests/integration/` for behaviour, `backend/tests/unit/` for pure
   logic.
3. **Fix the cause, not the symptom.** If a value is wrong, find where it became
   wrong rather than correcting it at the point of display.
4. **Run the full suite**, not just your new test.
5. **Commit the test and the fix together**, with a message saying what broke
   and why.

## Adding a feature

1. Check it against the proposal. If it is not in the proposal, be clear that it
   is an extension.
2. Reuse the existing architecture. In particular:
   - New family data is **scoped by `familyId` at the query**, never filtered
     after the fact.
   - New routes go behind `protect`, plus `requireParentalConsent` and
     `denyGuestWrites` if they touch family content.
   - New user-facing strings go into all three locale bundles at once.
3. Add tests covering the happy path, the authorisation failure, and cross-family
   isolation.
4. Update `docs/API_REFERENCE.md` if you added an endpoint.

---

## Rules that must not be broken

These encode decisions that took real debugging to get right.

| Rule | Why |
|---|---|
| Never return fabricated data on API failure | The app once showed an invented invite code (`MLRV2026`) when the API failed — an admin could have shared a code nobody could use |
| Never claim an action succeeded unless it did | Email invitations report `emailSent: false` when SMTP is unset, rather than implying delivery |
| Scope every family query by `familyId` | The one handler that did not (`mark_read`) allowed a cross-family write |
| Never look up by id alone in a controller | `updateMemberRole` did this and allowed an IDOR across families |
| Keep the three locale bundles in step | Enforced by `tests/unit/i18nBundles.test.js` |
| Never store a raw invitation token | Only its SHA-256 hash is persisted |
| Reminders claim their row before sending | The unique index on `SentReminder` is what prevents double-sends across restarts |

---

## Routine tasks

**Dependencies.** Check quarterly.

```bash
cd backend && npm outdated
```

```bash
cd family-connect-mobile && npx expo install --check
```

Upgrade the Expo SDK deliberately, not incidentally — it moves native modules.
Run the full suite and the manual plan afterwards.

**Secrets.** Rotate `JWT_SECRET` and `JWT_REFRESH_SECRET` if either may have
leaked. Rotating them signs every user out, which is the intended effect.

**Database.** `SentReminder` rows expire automatically after 400 days. Nothing
else needs pruning at family scale.

**Logs.** `backend/logs/` is gitignored and grows unbounded; rotate or clear it
periodically in production.

---

## Releasing

1. Full suite green.
2. Work through `docs/MANUAL_TEST_PLAN.md` on a real device.
3. Update `docs/KNOWN_LIMITATIONS.md` — it must describe reality.
4. Tag the release.
5. Deploy the backend before shipping the app build, so the app never talks to
   an older API.

---

## Known follow-up work

Kept honest in `docs/KNOWN_LIMITATIONS.md`. The current items are:

- Finish localising the remaining screens.
- Connect the mobile safe-zone screen to the working backend API (it still uses
  local storage).
- Add CI so the suite runs on every push, rather than only when someone
  remembers.
- Run the SUS study — see `docs/SUS_EVALUATION.md`.
