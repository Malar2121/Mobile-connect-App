# Physical device test matrix

**Prepared:** 2026-09-10 · **Updated:** 2026-09-11 for media approval, stories, the family journal, full localisation and the fixes listed in `DEVICE_READINESS_AUDIT.md` · **Code:** `main` at `0430a9d` or later · **Requirements:** `CT_2020_004.pdf`, traced in `REQUIREMENTS_TRACEABILITY.md`

> **Nothing in this matrix has been executed.** Every *Actual Result* is
> **NOT TESTED**. Replace it only with what you actually observed on a phone.

**Status values:** `PENDING` (ready to run) · `BLOCKED` (reason given).
When you run a row, set Status to `PASS`, `FAIL` (describe the defect) or `BLOCKED`.

---

## Setup

### Devices

| Label | Device | Android version | Expo Go version |
|---|---|---|---|
| **D1** | ___________ | ______ | must be SDK 54 |
| **D2** | ___________ | ______ | must be SDK 54 |

### Accounts (create in the app, with email addresses you control)

| Account | Register as | Role and family | Normally on |
|---|---|---|---|
| ADM-A | Adult | Admin of "PT Family A" | D1 |
| MEM-A | Adult | Member of A — joins by QR | D2 |
| JN-A | Adult | Member of A — joins by typed code; later made guest | D2 |
| INV-A | Adult | Joins A by pasting an email invitation token (register with the invited address) | D2 |
| CHD-A | Child | Child in A — approval path | D2 |
| CHD-A2 | Child | Child in A — rejection path | D2 |
| ELD-A | Elder | Member of A | D1 or D2 |
| ADM-B | Adult | Admin of "PT Family B" (isolation; only adult in B) | D2 |

### Files to have on D2

- A photo under 5 MB
- A video of 5–10 seconds, **10 MB or less** (note the size)
- A video over 10 MB, 30–60 seconds (note the size)
- A small PDF, under 2 MB
- A non-invite QR code on the PC screen (for example a website QR)

### Evidence

Keep screenshots and screen recordings in a folder outside the repository. Name them
`<ID>_<D1|D2>.png` or `.mp4`, for example `QR-05_D2.mp4`.

### Pre-flight (tick all before the first row)

- [ ] PF-01 Backend running (`npm run dev` in `backend/`) — log shows MongoDB connected and port 5000
- [ ] PF-02 `http://localhost:5000/health` returns success on the PC
- [ ] PF-03 `http://<PC Wi-Fi address>:5000/health` opens in **each phone's browser**
- [ ] PF-04 Store Expo Go uninstalled; **Expo Go for SDK 54** installed on both phones
- [ ] PF-05 `npm start` in `family-connect-mobile/` shows the API address it will use; it matches PF-03
- [ ] PF-06 App opens on both phones (Metro QR code)
- [ ] PF-07 Sinhala and Tamil keyboards added (Gboard); Tamil and Sinhala text-to-speech voice data checked
- [ ] PF-08 Reminder rows scheduled between 06:00 and 23:30 local time (reminder days are counted on UTC dates)

> Rate limits are counted per member (2,000 reads and 300 changes per 15 minutes),
> so switching screens during testing should not hit them. A 429 is still a
> configuration effect, not an app defect — record it.

> Events, RSVPs, polls, memories and their approval, stories, the journal,
> celebrations and consent decisions are **not pushed live** to the other phone.
> Pull to refresh or reopen the screen before judging those rows. Chat messages,
> edits, deletions and pins arrive live.

---

## 1. Authentication

| ID | Feature | Account/Role | Device 1 | Device 2 | Expected Result | Actual Result | Evidence/Screenshot | Status |
|---|---|---|---|---|---|---|---|---|
| AUTH-01 | Cold launch | — | Open the app in Expo Go | — | Splash, then sign-in screen; no crash or red error screen (an Expo Go push-support warning may appear — note it) | NOT TESTED | | PENDING |
| AUTH-02 | Register | ADM-A | Register as Adult | — | Account created and signed in; offered create or join family | NOT TESTED | | PENDING |
| AUTH-03 | Sign out and in | ADM-A | Sign out, then sign in | — | Back on the dashboard with the same data | NOT TESTED | | PENDING |
| AUTH-04 | Wrong password | ADM-A | Sign in with a wrong password | — | Clear error; stays on sign-in; no crash | NOT TESTED | | PENDING |
| AUTH-05 | Session persists | ADM-A | Force-quit Expo Go, reopen the app | — | Still signed in | NOT TESTED | | PENDING |
| AUTH-06 | Backend down | ADM-A | Stop the backend and try to sign in; start it and retry | — | Network error, never a fake success; works after restart | NOT TESTED | | PENDING |

## 2. Family creation and joining

| ID | Feature | Account/Role | Device 1 | Device 2 | Expected Result | Actual Result | Evidence/Screenshot | Status |
|---|---|---|---|---|---|---|---|---|
| FAM-01 | Create family | ADM-A | Create "PT Family A" | — | Family created; ADM-A shown as admin | NOT TESTED | | PENDING |
| FAM-02 | Invite code | ADM-A | Family → Invite members; close and reopen | — | Real code shown; same code on reopening | NOT TESTED | | PENDING |
| FAM-03 | Invite screen, backend down | ADM-A | Stop the backend; reopen Invite members | — | Error shown — never an invented code | NOT TESTED | | PENDING |
| FAM-04 | Invalid code | JN-A | — | Register JN-A; Join Family → type a wrong code | Invalid-code error; no crash | NOT TESTED | | PENDING |
| FAM-05 | Join by typed code | ADM-A, JN-A | Members → pull to refresh | Join Family → type the real code | D2 joins PT Family A; D1 lists JN-A after refresh | NOT TESTED | | PENDING |
| FAM-06 | Already in a family | JN-A | — | Join Family again with the code | Refused: already belongs to a family | NOT TESTED | | PENDING |

## 3. QR invitation

| ID | Feature | Account/Role | Device 1 | Device 2 | Expected Result | Actual Result | Evidence/Screenshot | Status |
|---|---|---|---|---|---|---|---|---|
| QR-01 | QR generation | ADM-A | Invite members → Show QR | — | QR code renders | NOT TESTED | | PENDING |
| QR-02 | Camera denied | MEM-A (no family) | — | Register MEM-A; open Scan invite; deny camera | Explanation and a button to Join Family (manual code) | NOT TESTED | | PENDING |
| QR-03 | Camera allowed | MEM-A | — | Grant camera (prompt, or Android Settings → Expo Go → Permissions) | Scanner view opens | NOT TESTED | | PENDING |
| QR-04 | Unrelated QR | MEM-A | Show a non-invite QR on the PC | Scan it | "Not a Family Connect invite"; can scan again | NOT TESTED | | PENDING |
| QR-05 | Scan invite QR | ADM-A, MEM-A | Show QR at full brightness; refresh Members afterwards | Scan from 20–30 cm and time it | D2 joins PT Family A; D1 lists MEM-A after refresh; record seconds and distance | NOT TESTED | | PENDING |

## 4. Email invitation

| ID | Feature | Account/Role | Device 1 | Device 2 | Expected Result | Actual Result | Evidence/Screenshot | Status |
|---|---|---|---|---|---|---|---|---|
| INV-01 | Invitation without SMTP | ADM-A | Family → Email invite → INV-A's address | — | App says it was **not** emailed and gives the invitation to share; listed as not emailed; never claims delivery | NOT TESTED | | PENDING |
| INV-05 | Accept by pasting | ADM-A, INV-A | Send the INV-01 invitation to D2 by any chat app; refresh Members afterwards | Register INV-A with the invited address; Join Family → paste the whole message | Joins PT Family A; D1 lists INV-A after refresh | NOT TESTED | | PENDING |
| INV-04 | Reuse invitation | INV-A | — | Leave the family, then paste the same invitation again | Refused as already used | NOT TESTED | | PENDING |
| INV-06 | Wrong account | JN-A | — | Paste an unused invitation meant for another address | Refused: the invitation is for a different account | NOT TESTED | | PENDING |
| INV-02 | Email delivered | ADM-A | Send an invitation | Check the inbox | Email arrives | NOT TESTED | | BLOCKED — SMTP not configured |
| INV-03 | Open emailed link | Invitee | — | Open the link in the email | Joins the family | NOT TESTED | | BLOCKED — SMTP not configured |

## 5. Roles and guest restrictions

| ID | Feature | Account/Role | Device 1 | Device 2 | Expected Result | Actual Result | Evidence/Screenshot | Status |
|---|---|---|---|---|---|---|---|---|
| RBAC-01 | Member cannot manage | JN-A (member) | — | Open another member's profile and the Family quick actions | No role change or Child approvals offered, or the server refuses with a clear message | NOT TESTED | | PENDING |
| RBAC-02 | Make guest | ADM-A, JN-A | Family → Members → JN-A → role: guest | Pull to refresh or reopen | Guest badge on D1; D2 behaves as a guest | NOT TESTED | | PENDING |
| RBAC-03 | Guest chat | JN-A (guest) | Keep the chat open | Send a message | Refused with a read-only explanation; nothing arrives on D1 | NOT TESTED | | PENDING |
| RBAC-04 | Guest writes | JN-A (guest) | Refresh the lists | Try: create event, upload memory, add celebration, vote in a poll, share a story | Every attempt refused; nothing appears on D1 | NOT TESTED | | PENDING |
| RBAC-05 | Guest reads | JN-A (guest) | — | Open events, memories, stories, celebrations, chat history | Content is visible | NOT TESTED | | PENDING |
| RBAC-06 | Last admin | ADM-A | Try to change own role away from admin | — | Not offered, or refused — the family keeps an admin | NOT TESTED | | PENDING |
| RBAC-07 | Restore member | ADM-A, JN-A | Set JN-A back to member | Send a chat message | Message is sent and arrives on D1 | NOT TESTED | | PENDING |

## 6. Child accounts and parental consent

| ID | Feature | Account/Role | Device 1 | Device 2 | Expected Result | Actual Result | Evidence/Screenshot | Status |
|---|---|---|---|---|---|---|---|---|
| CON-01 | Child joins | CHD-A | Read out the invite code | Register as Child; Join Family with the code | Joined, and told a parent or guardian must approve | NOT TESTED | | PENDING |
| CON-02 | Child gated | CHD-A | — | Open chat, memories, events | Blocked with a "waiting for a parent or guardian" explanation, not a generic error | NOT TESTED | | PENDING |
| CON-03 | Guardian queue | ADM-A | Family → Child approvals | — | CHD-A listed | NOT TESTED | | PENDING |
| CON-04 | No self-approval | CHD-A | — | Look for an approval option | Not available, or refused | NOT TESTED | | PENDING |
| CON-05 | Approve | ADM-A, CHD-A | Approve CHD-A | Keep the chat screen open; then pull to refresh or reopen | Child can now see family content; live chat starts without signing in again | NOT TESTED | | PENDING |
| CON-06 | Reject | ADM-A, CHD-A2 | Reject CHD-A2 | Register CHD-A2 as Child and join; reopen after the rejection | Access stays closed with a distinct "not approved" message | NOT TESTED | | PENDING |

## 7. Events

| ID | Feature | Account/Role | Device 1 | Device 2 | Expected Result | Actual Result | Evidence/Screenshot | Status |
|---|---|---|---|---|---|---|---|---|
| EVT-01 | Create event | ADM-A | Create "PT-EVT", three days ahead, with a location; submit the first step with the title empty first | — | Empty title shows a clear message (no crash); then the event appears in the list and the calendar | NOT TESTED | | PENDING |
| EVT-02 | Event reaches family | MEM-A | — | Events → pull to refresh | PT-EVT visible | NOT TESTED | | PENDING |
| EVT-03 | Edit event | ADM-A, MEM-A | Edit the title and date | Reopen the event | Changes shown on both | NOT TESTED | | PENDING |
| EVT-04 | RSVP | ADM-A, MEM-A | Reopen the event's RSVPs | RSVP Going | D1 shows MEM-A going after refresh | NOT TESTED | | PENDING |
| EVT-05 | Event note | ADM-A, MEM-A | Reopen the event | Add note "PT-NOTE" on Event Details | Note with author and time on both | NOT TESTED | | PENDING |
| EVT-06 | Delete event | ADM-A, MEM-A | Delete a test event | Pull to refresh | Gone on both | NOT TESTED | | PENDING |
| EVT-07 | Quick actions | ADM-A | Events quick actions: Calendar, Celebrations, Agenda — in English, then in Sinhala | — | Each opens its screen in both languages | NOT TESTED | | PENDING |

## 8. Availability polling and Smart Date

| ID | Feature | Account/Role | Device 1 | Device 2 | Expected Result | Actual Result | Evidence/Screenshot | Status |
|---|---|---|---|---|---|---|---|---|
| POLL-01 | Create poll | ADM-A | Create an availability poll with 3 dates | — | Poll appears | NOT TESTED | | PENDING |
| POLL-02 | No votes | ADM-A | Open the poll before anyone votes | — | Earliest date suggested; says no one has voted yet | NOT TESTED | | PENDING |
| POLL-03 | Two-phone votes | ADM-A, MEM-A | Vote Yes on date 2 | Vote Yes on date 2, Maybe on date 3 | After reopening, identical counts on both | NOT TESTED | | PENDING |
| POLL-04 | Suggestion follows votes | ADM-A | Reopen the poll | — | Date 2 suggested, with reason and confidence text | NOT TESTED | | PENDING |
| POLL-05 | A "No" moves it | ADM-A, MEM-A | Reopen the poll | Change the date 2 vote to No | Suggestion moves to a date nobody said No to (date 3 by the ranking rules); both agree after reopening | NOT TESTED | | PENDING |
| POLL-06 | Close poll | ADM-A, MEM-A | Close the poll | Reopen the poll | Closed on both; same chosen date; voting disabled | NOT TESTED | | PENDING |

## 9. Celebrations

| ID | Feature | Account/Role | Device 1 | Device 2 | Expected Result | Actual Result | Evidence/Screenshot | Status |
|---|---|---|---|---|---|---|---|---|
| CEL-01 | Birthday from profile | ADM-A, MEM-A | Celebrations → pull to refresh | Profile → set date of birth | MEM-A's birthday on D1 with a countdown | NOT TESTED | | PENDING |
| CEL-02 | Anniversary | ADM-A | Add an anniversary | — | Listed with a countdown | NOT TESTED | | PENDING |
| CEL-03 | Cultural event | ADM-A, MEM-A | Add a cultural event (e.g. Sinhala and Tamil New Year) | Refresh Celebrations | Listed on both | NOT TESTED | | PENDING |
| CEL-04 | Delete own | ADM-A | Delete the CEL-02 anniversary | — | Removed | NOT TESTED | | PENDING |

## 10. Reminders and notifications

| ID | Feature | Account/Role | Device 1 | Device 2 | Expected Result | Actual Result | Evidence/Screenshot | Status |
|---|---|---|---|---|---|---|---|---|
| REM-01 | Celebration reminder | ADM-A, MEM-A | Add a celebration dated tomorrow with a 1-day reminder (record the setting and the time) | Wait, then open Notifications | Within 60 min (the sweep runs hourly) a "… is tomorrow" entry on both phones | NOT TESTED | | PENDING |
| REM-02 | Birthday reminder | ADM-A, MEM-A | Wait, then open Notifications | Set MEM-A's date of birth to tomorrow | Within 60 min ADM-A has the reminder; MEM-A does **not** get their own | NOT TESTED | | PENDING |
| REM-03 | No duplicate | ADM-A, MEM-A | Check again after the next hourly sweep | Same | Exactly one reminder per occasion per person | NOT TESTED | | PENDING |
| REM-04 | Event reminder | ADM-A, MEM-A | Create an event dated tomorrow with a 1-day reminder (record the setting) | Wait, then open Notifications | Within 60 min a reminder on both phones | NOT TESTED | | PENDING |
| NOTIF-01 | Notification tap-through | MEM-A | — | Notifications → tap a mention, a reminder and a memory review request | Opens the related chat, event, celebration or Review screen | NOT TESTED | | PENDING |
| NOTIF-02 | Push permission prompt | Any | Native build | — | Android 13+ asks for notification permission | NOT TESTED | | BLOCKED — push is not available in Expo Go on Android; needs a native build and Firebase |
| NOTIF-03 | Reminder push, app closed | ADM-A, MEM-A | Close the app | — | Reminder arrives as a system notification | NOT TESTED | | BLOCKED — Firebase not configured |
| NOTIF-04 | Tap push | MEM-A | — | Tap a push notification | Opens the target screen | NOT TESTED | | BLOCKED — Firebase not configured |

## 11. Memories — photos, videos, approval

| ID | Feature | Account/Role | Device 1 | Device 2 | Expected Result | Actual Result | Evidence/Screenshot | Status |
|---|---|---|---|---|---|---|---|---|
| MEM-01 | Photo from gallery | ADM-A, MEM-A | Approve it (APPR-02), then pull to refresh | Upload the photo with a caption | On both phones after approval; caption intact | NOT TESTED | | PENDING |
| MEM-02 | Photo from camera | MEM-A | — | Upload from the camera (permission prompt) | Appears, marked as waiting for approval | NOT TESTED | | PENDING |
| MEM-03 | Short video | ADM-A, MEM-A | Approve it, then open and play it | Upload the clip of 10 MB or less | Plays on D1; record the file size | NOT TESTED | | PENDING |
| MEM-04 | Video over 10 MB | MEM-A | — | Upload the clip over 10 MB | "That file is too large" (in the chosen language); no crash; no fake success; record the file size | NOT TESTED | | PENDING |
| MEM-05 | Sinhala/Tamil caption | ADM-A, MEM-A | View it after approval | Type the caption in Sinhala or Tamil | Identical text on D1 | NOT TESTED | | PENDING |
| MEM-06 | No connection | MEM-A | — | Airplane mode on → upload | Clear error; nothing appears later | NOT TESTED | | PENDING |
| MEM-07 | Delete own | ADM-A, MEM-A | Pull to refresh | Delete the MEM-01 photo | Gone on both | NOT TESTED | | PENDING |
| MEM-08 | Photo denied | MEM-A | — | Deny photo access when uploading | Explanation in the chosen language; no crash | NOT TESTED | | PENDING |
| APPR-01 | Upload waits | ADM-A, MEM-A | Memories → pull to refresh | Upload a photo | D2 shows it as waiting; D1's gallery does **not** show it; D1 sees a **Review** button and a review notification | NOT TESTED | | PENDING |
| APPR-02 | Approve | ADM-A, MEM-A | Review → approve | Open Notifications; pull to refresh Memories | D2 notified of approval; the photo is in both galleries | NOT TESTED | | PENDING |
| APPR-03 | Reject with reason | ADM-A, MEM-A | Review → reject a second upload with a reason | Open Notifications | D2 told it was not approved, with the reason; the family never sees it | NOT TESTED | | PENDING |
| APPR-04 | No self-review | ADM-A, MEM-A | Upload a photo; open Review | Open Review | D1's own upload is not offered to D1 for review; D2 can approve it | NOT TESTED | | PENDING |
| APPR-05 | Guest cannot review | JN-A (guest) | — | Open Memories and look for Review | No review option, or refused with a clear message | NOT TESTED | | PENDING |
| APPR-06 | Only adult | ADM-B | — | In PT Family B (no other members), upload a photo | Shared straight away; no waiting state | NOT TESTED | | PENDING |
| QUOTA-01 | Storage allowance | MEM-A | Set `FAMILY_MEDIA_QUOTA_MB=1` in `backend/.env` and restart (undo afterwards) | Upload a photo over 1 MB | Clear "family storage is full" message; nothing uploaded | NOT TESTED | | PENDING |

## 12. Stories and family journal

| ID | Feature | Account/Role | Device 1 | Device 2 | Expected Result | Actual Result | Evidence/Screenshot | Status |
|---|---|---|---|---|---|---|---|---|
| STORY-01 | Share a story | ADM-A, MEM-A | Memories → Stories → pull to refresh | Memories → Stories → Share: title and body in Sinhala or Tamil, category "Tradition" | Story on D1 with identical text, author and category | NOT TESTED | | PENDING |
| STORY-02 | Others cannot edit | JN-A (member) | — | Open MEM-A's story | No edit or delete option, or refused | NOT TESTED | | PENDING |
| STORY-03 | Admin can edit | ADM-A, MEM-A | Edit and then delete MEM-A's story | Refresh | Edit shown on D2, then gone | NOT TESTED | | PENDING |
| STORY-04 | Validation | MEM-A | — | Try to share with an empty title | Clear message; nothing saved | NOT TESTED | | PENDING |
| HIST-01 | Journal | ADM-A, MEM-A | Family tree → Journal: fill Origins and Traditions, save | Family tree → Journal → pull to refresh | Same text on D2, with who updated it | NOT TESTED | | PENDING |
| HIST-02 | Guest journal | JN-A (guest) | — | Open the Journal and try to edit | Readable; saving refused with a read-only message | NOT TESTED | | PENDING |

## 13. Chat — real time, mentions, files, pins

| ID | Feature | Account/Role | Device 1 | Device 2 | Expected Result | Actual Result | Evidence/Screenshot | Status |
|---|---|---|---|---|---|---|---|---|
| CHAT-01 | Live delivery | ADM-A, MEM-A | Send "PT-CHAT-01" | Chat open, untouched | Arrives within about 2 s without refresh | NOT TESTED | | PENDING |
| CHAT-02 | Both directions | ADM-A, MEM-A | Chat open | Reply | Same order on both phones | NOT TESTED | | PENDING |
| CHAT-03 | Background and return | ADM-A, MEM-A | Send 3 numbered messages | App in the background for 1–2 min, then return | All 3 shown exactly once | NOT TESTED | | PENDING |
| CHAT-04 | Connection drop | ADM-A, MEM-A | Watch the chat | Airplane mode on → send → off, wait 30 s | Failure shown or message queued; afterwards no loss or duplicates on either phone (record exactly) | NOT TESTED | | PENDING |
| CHAT-05 | Keyboard | MEM-A | — | Type a long message; open and close the keyboard | Input stays above the keyboard; latest message visible | NOT TESTED | | PENDING |
| MENT-01 | Mention renders | ADM-A, MEM-A | Send "@<MEM-A name> PT-MENT" | Chat open | Highlighted as a mention on both | NOT TESTED | | PENDING |
| MENT-02 | Mention notification | ADM-A, MEM-A | Send a mention | Stay on the dashboard, then open Notifications | Mention notification listed | NOT TESTED | | PENDING |
| MENT-03 | Non-member name | ADM-A, MEM-A | Send "@NotInFamily hello" | Open Notifications | Plain text; no mention notification | NOT TESTED | | PENDING |
| MENT-04 | Edit adds mention | ADM-A, MEM-A | Edit an earlier message to add @MEM-A | Open Notifications | Mention appears; exactly one new notification | NOT TESTED | | PENDING |
| MENT-05 | Mention push | ADM-A, MEM-A | Send a mention | App closed | System notification arrives | NOT TESTED | | BLOCKED — Firebase not configured |
| FILE-01 | Share photo | ADM-A, MEM-A | Attach a photo | Tap it | Thumbnail on both; opens full size on D2 | NOT TESTED | | PENDING |
| FILE-02 | Share PDF | ADM-A, MEM-A | Attach the PDF | Tap it | File name shown; opens or downloads on D2 | NOT TESTED | | PENDING |
| FILE-03 | Shared files list | MEM-A | — | Chat → Files | Photo under images; PDF under documents | NOT TESTED | | PENDING |
| FILE-04 | File over 10 MB | MEM-A | — | Attach the video over 10 MB | "That file is too large"; nothing sent | NOT TESTED | | PENDING |
| VOICE-MSG-01 | Voice message | ADM-A, MEM-A | Play it | Record and send a voice message | Plays on D1; bars show playback progress | NOT TESTED | | PENDING |
| PIN-01 | Pin | ADM-A, MEM-A | Pin a message | Chat open, untouched | Pinned bar appears on D2 without refresh | NOT TESTED | | PENDING |
| PIN-02 | Pinned list | MEM-A | — | Chat → Pinned | Message listed | NOT TESTED | | PENDING |
| PIN-03 | Unpin | ADM-A, MEM-A | Unpin | Chat open | Pinned bar clears on D2 | NOT TESTED | | PENDING |

## 14. Languages — English, Sinhala, Tamil

| ID | Feature | Account/Role | Device 1 | Device 2 | Expected Result | Actual Result | Evidence/Screenshot | Status |
|---|---|---|---|---|---|---|---|---|
| LANG-01 | English baseline | ADM-A | Walk dashboard, events, poll, celebrations, memories, review, stories, journal, chat, family, map, profile | — | No raw keys (e.g. `events.titleField`), no blank labels | NOT TESTED | | PENDING |
| LANG-02 | Sinhala | ADM-A | Profile → Language → සිංහල; repeat the walk | — | Whole interface in Sinhala. **Any app text still in English is a FAIL** — record screen and text (the source scan finds none) | NOT TESTED | | PENDING |
| LANG-03 | Tamil | MEM-A | — | Profile → Language → தமிழ்; repeat the walk | Whole interface in Tamil; any app text in English is a FAIL | NOT TESTED | | PENDING |
| LANG-04 | Persists | ADM-A, MEM-A | Force-quit, reopen | Force-quit, reopen | Language kept on both | NOT TESTED | | PENDING |
| LANG-05 | Script rendering | ADM-A, MEM-A | Sinhala screens | Tamil screens | No boxes (□); no clipped vowel signs; even line height | NOT TESTED | | PENDING |
| LANG-06 | Long strings | MEM-A | — | In Tamil: event wizard, poll card, member profile, review screen, story editor, settings, elder dashboard | Text wraps; no overlap; buttons tappable | NOT TESTED | | PENDING |
| LANG-07 | Typing Sinhala/Tamil | ADM-A, MEM-A | View the results | With Gboard in Sinhala and Tamil: chat message, event title, caption, story | Identical text on D1 | NOT TESTED | | PENDING |
| LANG-08 | Notifications follow language | ADM-A (Sinhala), MEM-A (Tamil) | Set Sinhala; wait for MEM-A's action | Set Tamil; send a chat message and share a story | D1's new notifications are in Sinhala, D2's in Tamil; what people wrote stays as written | NOT TESTED | | PENDING |
| LANG-09 | Errors follow language | JN-A (guest, Tamil) | — | In Tamil, try to send a chat message as a guest; enter a wrong invite code | Refusal and error messages in Tamil | NOT TESTED | | PENDING |
| LANG-10 | Relationships across languages | ADM-A, MEM-A | In English, set MEM-A's relationship to Father | Switch to Tamil; open the family tree and MEM-A's profile | Shown as the Tamil word for father; still the same relationship | NOT TESTED | | PENDING |

## 15. Elder Mode and voice prompts

| ID | Feature | Account/Role | Device 1 | Device 2 | Expected Result | Actual Result | Evidence/Screenshot | Status |
|---|---|---|---|---|---|---|---|---|
| ELD-01 | Elder Mode on | ELD-A | Register as Elder (or Profile → interface mode → Elder) | — | Larger text and buttons; simplified dashboard | NOT TESTED | | PENDING |
| ELD-02 | Core tasks | ELD-A | From the elder dashboard: open events, create an event, open memories, open chat, see celebrations | — | Each reachable without help; record taps and seconds | NOT TESTED | | PENDING |
| ELD-03 | Maximum font size | ELD-A | Android Settings → Display → font size and display size at maximum | — | No clipped or overlapping text on the elder dashboard, event create, chat | NOT TESTED | | PENDING |
| ELD-04 | Elder in Sinhala/Tamil | ELD-A | Switch the language | — | Readable; not truncated | NOT TESTED | | PENDING |
| ELD-05 | Touch targets | ELD-A | Tap every primary button one-handed | — | No mis-taps (record any) | NOT TESTED | | PENDING |
| VOICE-01 | Screen announced | ELD-A | Media volume up; open the elder dashboard | — | A prompt is spoken | NOT TESTED | | PENDING |
| VOICE-02 | Tamil and Sinhala speech | ELD-A | Switch to Tamil and reopen; then Sinhala | — | Spoken in that language; if no voice exists, record what happens and which TTS engine | NOT TESTED | | PENDING |
| VOICE-03 | Prompts off | ELD-A | Profile → voice prompts off; restart the app | — | Speech stops immediately and stays off | NOT TESTED | | PENDING |
| VOICE-04 | Standard mode silent | ADM-A | Standard mode; navigate around | — | No speech | NOT TESTED | | PENDING |
| VOICE-05 | With TalkBack | ELD-A | Turn on TalkBack in Elder Mode | — | Prompts do not talk over TalkBack (record) | NOT TESTED | | PENDING |

## 16. Dark mode (not a PDF requirement)

| ID | Feature | Account/Role | Device 1 | Device 2 | Expected Result | Actual Result | Evidence/Screenshot | Status |
|---|---|---|---|---|---|---|---|---|
| DARK-01 | Dark theme | ADM-A | Profile → theme → Dark; walk the main screens | — | All text legible; no white-on-white or black-on-black; status bar readable | NOT TESTED | | PENDING |
| DARK-02 | Follows system | ADM-A | Theme → System; toggle Android's dark theme | — | App follows the system setting | NOT TESTED | | PENDING |
| DARK-03 | Elder and dark | ELD-A | Elder Mode with the Dark theme | — | Legible | NOT TESTED | | PENDING |

## 17. Family isolation

| ID | Feature | Account/Role | Device 1 | Device 2 | Expected Result | Actual Result | Evidence/Screenshot | Status |
|---|---|---|---|---|---|---|---|---|
| ISO-01 | Second family | ADM-B | — | Register ADM-B; create "PT Family B" | Family B has none of Family A's data | NOT TESTED | | PENDING |
| ISO-02 | Content isolation | ADM-A, ADM-B | Create event "ISO-A", upload and approve a photo, share a story, add a celebration | Refresh events, memories, stories, celebrations, members | None of ISO-A's items appear | NOT TESTED | | PENDING |
| ISO-03 | Live chat isolation | ADM-A, ADM-B | Send "ISO-A chat" | Chat open | Nothing received | NOT TESTED | | PENDING |
| ISO-04 | Other family's code | ADM-B | Show Family A's code | Join Family with it | Refused: already belongs to a family | NOT TESTED | | PENDING |

## 18. Navigation and permissions

| ID | Feature | Account/Role | Device 1 | Device 2 | Expected Result | Actual Result | Evidence/Screenshot | Status |
|---|---|---|---|---|---|---|---|---|
| NAV-01 | Back gesture | ADM-A | Back gesture from event details, member profile, scanner, poll, story | — | Goes back one level; no blank screen; no unexpected exit | NOT TESTED | | PENDING |
| NAV-02 | After sign-out | ADM-A | Sign out, then press back | — | No family data reachable | NOT TESTED | | PENDING |
| NAV-03 | Every tab and quick action | ADM-A | Open every tab, then every quick action on Family, Family tree, Memories, Chat and Map | — | Each opens without a red error screen (record any that do not) | NOT TESTED | | PENDING |

## 19. Performance observations (Objective 8)

Expo Go runs a development bundle, which is slower than a release build. Record numbers; there are no targets.

| ID | Feature | Account/Role | Device 1 | Device 2 | Expected Result | Actual Result | Evidence/Screenshot | Status |
|---|---|---|---|---|---|---|---|---|
| PERF-01 | Cold start | Any | Tap the icon → sign-in screen, 3 runs | — | Record seconds for each run | NOT TESTED | | PENDING |
| PERF-02 | Chat scroll | MEM-A | — | Scroll through 100+ messages | Record smooth or stuttering | NOT TESTED | | PENDING |
| PERF-03 | Gallery load | MEM-A | — | Open the memory gallery with 10+ items | Record seconds | NOT TESTED | | PENDING |
| PERF-04 | Upload time | MEM-A | — | Upload a photo of about 5 MB over Wi-Fi | Record seconds | NOT TESTED | | PENDING |

---

## Two-device procedures

Run with D1 and D2 side by side, both recording the screen.

### P1 — QR scan (QR-02 … QR-05)

1. D1: sign in as ADM-A → Family → Invite members → Show QR. Set brightness to maximum.
2. D2: register MEM-A as Adult. Do not join yet.
3. D2: Join Family → scan. **Deny** the camera → check the explanation and the Join Family button (QR-02).
4. D2: grant the camera, via the prompt or Android Settings → Apps → Expo Go → Permissions (QR-03).
5. D2: scan the non-invite QR on the PC screen → expect "Not a Family Connect invite" (QR-04).
6. D2: scan D1's QR from 20–30 cm and time it → joined (QR-05).
7. D1: Members → pull to refresh → MEM-A listed.

### P2 — Real-time chat (CHAT-01 … 04, PIN-01 … 03)

1. D1 = ADM-A, D2 = MEM-A, both in the family conversation.
2. D1: send "PT-CHAT-01 <time>". Do not touch D2 — it should appear within about 2 seconds.
3. D2: reply. Compare the order on both phones.
4. D2: go to the home screen for 1–2 minutes. D1: send "1", "2", "3". D2: return → each exactly once.
5. D2: airplane mode on → send "offline test" → airplane mode off → wait 30 s. Check both phones for loss or duplicates.
6. D1: pin a message → D2 shows the pinned bar without refresh. D1: unpin → the bar clears.

### P3 — Mention notification (MENT-01 … 04)

1. D2 (MEM-A): leave the chat and stay on the dashboard.
2. D1: in chat type `@` and MEM-A's name, then send "@<name> PT-MENT".
3. D2: Notifications → mention entry present → tap it → opens the chat.
4. D1: send "@NotInFamily hello" → D2 gets no mention notification.
5. D1: edit an earlier plain message to add "@<name>" → D2 gets exactly one new mention notification.
6. Push with the app closed is BLOCKED (Firebase).

### P4 — Event and availability sync (EVT, POLL)

Nothing here is live — pull to refresh or reopen before judging.

1. D1: create "PT-EVT" three days ahead. D2: Events → refresh → visible.
2. D2: RSVP Going and add note "PT-NOTE". D1: reopen the event → RSVP and note shown.
3. D1: create an availability poll with 3 dates. Before any vote: earliest date, "no one has voted yet".
4. D1: Yes on date 2. D2: Yes on date 2, Maybe on date 3. Both reopen → same counts; date 2 suggested.
5. D2: change date 2 to No. Both reopen → the suggestion moves (expected date 3).
6. D1: close the poll. D2: reopen → closed, same chosen date.

### P5 — Invitation and join (FAM-02 … 06, INV-01, INV-04 … 06)

1. D1: Family → Invite members → note the code; reopen → same code.
2. D2: register JN-A; Join Family → a wrong code → error.
3. D2: the correct code → joined PT Family A.
4. D2: Join Family again → refused.
5. D1: Members → refresh → JN-A listed as a member.
6. D1: Email invite → INV-A's address → the app says not emailed and offers the invitation. Send it to D2 through any chat app.
7. D2: sign out → register INV-A with that address → Join Family → paste the message → joined (INV-05).
8. D2: as JN-A, paste an unused invitation meant for another address → refused (INV-06).
9. Email delivery and the emailed link are BLOCKED (SMTP not configured).

### P6 — Child consent (CON-01 … 06)

1. D1: ADM-A has the invite code ready.
2. D2: sign out → register CHD-A as **Child** → Join Family with the code → guardian-approval message.
3. D2: open chat, memories, events → each blocked with the waiting message.
4. D1: Family → Child approvals → CHD-A listed. D2: confirm there is no self-approval.
5. D1: Approve. D2: pull to refresh or reopen the app → family content visible.
6. D2: sign out → register CHD-A2 as Child → join. D1: Reject. D2: reopen → distinct not-approved message.

### P7 — Family isolation (ISO-01 … 04)

1. D2: sign out → register ADM-B → create PT Family B.
2. D1 (ADM-A): create event "ISO-A", upload and approve a photo, share a story, add a celebration, send "ISO-A chat".
3. D2: refresh events, memories, stories, celebrations, chat, members → none of Family A's items.
4. D2: Join Family with Family A's code → refused.

### P8 — Media approval (APPR-01 … 06)

1. D1 = ADM-A, D2 = MEM-A, both in PT Family A. D1 on Memories.
2. D2: upload a photo → marked as waiting on D2.
3. D1: pull to refresh → not in the gallery; **Review** visible; a review notification in Notifications.
4. D1: Review → approve. D2: Notifications → approval entry. Both refresh → photo in both galleries.
5. D2: upload a second photo. D1: reject it with the reason "PT reason". D2: the notification shows the reason; the photo never appears on D1.
6. D1: upload a photo → D1's Review does not offer it; D2 approves it.
7. JN-A as guest: no review option.
8. ADM-B in PT Family B: upload → shared immediately.

---

## Summary (fill in after testing)

| Section | Pass | Fail | Blocked |
|---|---|---|---|
| 1 Authentication | | | |
| 2 Family | | | |
| 3 QR | | | |
| 4 Email invitation | | | 2 |
| 5 Roles and guest | | | |
| 6 Consent | | | |
| 7 Events | | | |
| 8 Polling and Smart Date | | | |
| 9 Celebrations | | | |
| 10 Reminders and notifications | | | 3 |
| 11 Memories and approval | | | |
| 12 Stories and journal | | | |
| 13 Chat | | | 1 |
| 14 Languages | | | |
| 15 Elder Mode and voice | | | |
| 16 Dark mode | | | |
| 17 Isolation | | | |
| 18 Navigation and permissions | | | |
| 19 Performance | | | |
| **Total** | | | **6** |
