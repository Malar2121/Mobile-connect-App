# Family Connect — Regression Report (Final Testing Phase)

**Date:** 2026-07-09
**Purpose:** Confirm that (a) previously-fixed defects remain fixed, and (b) the fixes applied in this testing phase did not break adjacent functionality.

---

## 1. Previously-fixed defects — re-verification

These were fixed in the earlier release audit. Each was re-checked in this phase (live where an endpoint exists, otherwise code-verified at file:line).

| ID | Area | Defect | Re-verification | Status |
|----|------|--------|-----------------|--------|
| RGN-01 | Memories | `MemoryGalleryScreen` TDZ crash (`policy` used before `const`) | `policy` declared before use; screen renders with data | ✅ HOLDS |
| RGN-02 | Map / SOS | SOS countdown never decremented; `confirmSOS` early-returned | Countdown effect decrements 5→0 and auto-sends; `confirmSOS` calls `sendSOSAlert`; cancel aborts; **live `POST /api/location/sos` → 200** | ✅ HOLDS |
| RGN-03 | Chat | Full history refetch on every incoming socket message | Socket handler upserts via `upsertMessage`; focus-effect deps exclude `messages.length` | ✅ HOLDS |
| RGN-04 | Map | Full family-locations refetch on every realtime location broadcast | `location_update` upserts a single member (`upsertLocationInMap`); no refetch | ✅ HOLDS |
| RGN-05 | Memories | `MemoryDetails` like crashed on null `user._id` while hydrating | `user?._id` guard + `isLikedByUser` null-guard | ✅ HOLDS |
| RGN-06 | Chat | Regex-injection / ReDoS in chat search | **Live:** search with `(.*)+`, `[`, `\`, `((((` all return 200 with literal matches (no 500) | ✅ HOLDS |
| RGN-07 | Backend | `node --check` on all backend files; no boot/import errors | Server boots, connects to MongoDB, all 10 route groups mount | ✅ HOLDS |
| RGN-08 | Navigation | No broken/undefined route names in main flows | Route inventory across 9 navigators verified | ✅ HOLDS |

**Result: 8/8 previously-fixed defects remain fixed.**

---

## 2. New fixes in this phase — regression impact check

For each fix applied now, adjacent functionality was re-tested live to ensure no regression.

### Fix BUG-C1 (FamilyMember on create/join/leave)
**Adjacent areas re-tested (live):**
- Family create → `201`, creator promoted to admin ✅
- Family join by invite code → `200`, member count = 2 ✅
- Duplicate-join guard → `400` ✅
- Non-admin leave → `200` (and `FamilyMember` removed) ✅
- Admin-cannot-leave rule → `400` ✅
- Family Tree now returns nodes for real family (`nodeCount=2`) ✅
- Relationship update `200`; non-admin edit-others `403`; invalid type `422` ✅

**Verdict:** No regression. The upsert avoids duplicate-key errors on the `{family,user}` unique index; leave cleans up the record.

### Fix BUG-H2 (admin guard on `/notifications/create`)
**Adjacent areas re-tested (live):**
- Non-admin `/create` → now `403` ✅
- Admin `/create` → `201` ✅
- `/create` missing recipients → `400` ✅
- `GET /notifications`, mark-read, delete, nonexistent-read (404) all unaffected ✅
- Auto-generated notifications (event/memory/chat/SOS) still flow via `notifyFamilyMembers` (unchanged path) ✅

**Verdict:** No regression. Only the manual broadcast endpoint gained a role check.

### Fix BUG-M1 (chat star flag before populate)
**Adjacent areas re-tested (live):**
- Star → `starred:true`; message appears in `GET /chat/starred` ✅
- Unstar path logic unchanged (toggle) ✅
- Pin/unpin, react, edit, delete, search, messages list all still PASS ✅

**Verdict:** No regression. Change is limited to the returned boolean; persisted state and populated payload identical.

### Fix BUG-M3 (leave-family navigation via getParent)
**Impact:** Isolated to `FamilySettingsScreen.handleLeave`. Uses the same `getParent().navigate` pattern already used across the app (Family, Notifications, LegacyProfiles screens). No shared code touched.
**Verdict:** No regression (code review). Recommend one on-device confirmation of the leave→Profile transition.

---

## 3. Full-suite re-run after fixes

The entire 122-case REST harness and 7-case socket harness were re-run **after** all fixes:

- REST: **121 / 122 PASS** (only BUG-L1 malformed-id 500 remains, unrelated to any fix).
- Socket: **7 / 7 PASS**.
- Previously-failing cases now passing due to fixes: Family Tree nodes, Family Tree relationship update, chat star flag, notifications admin-guard, refresh-token rotation (test timing corrected).

**Regression conclusion: PASS.** No previously-working functionality was broken by the fixes; three real defects were closed and re-verified.
