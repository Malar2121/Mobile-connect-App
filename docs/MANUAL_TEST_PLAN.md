# Manual acceptance test plan — physical device

> **Why this exists.** Everything in this project has been verified on the
> server side by automated tests, and on the mobile side by parse checks and API
> contract tracing. **The app has not been run on a physical device during
> development.** That gap is real and this checklist closes it.
>
> Mark each row honestly. **Do not mark PASS for anything you have not actually
> done on a device.**

**Tester:** ___________  **Date:** ___________
**Device / OS:** ___________  **Build:** ___________
**Backend used:** ☐ local  ☐ hosted — URL: ___________

Legend: **PASS** · **FAIL** (note the defect) · **BLOCKED** (say what blocks it)

---

## A. Startup and authentication

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| A1 | Launch the app cold | Splash then login, no crash | | |
| A2 | Register a new adult account | Account created, signed in | | |
| A3 | Sign out, sign back in | Returns to dashboard | | |
| A4 | Enter a wrong password | Clear error, no crash | | |
| A5 | Force-quit and reopen while signed in | Still signed in | | |
| A6 | Leave the app idle past token expiry, then act | Silent refresh, no forced logout | | |
| A7 | Enable 2FA, sign out, sign in | Prompts for the code and accepts it | | |

## B. Family and onboarding

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| B1 | Create a family | Family created, you are admin | | |
| B2 | Open Invite members | A real invite code is shown | | |
| B3 | Turn off the backend, reopen the invite screen | An error — **never** a made-up code | | |
| B4 | Show the QR code | QR renders on-device | | |
| B5 | **Second device:** scan that QR | Joins the family | | |
| B6 | Scan an unrelated QR (e.g. a Wi-Fi code) | "Not a Family Connect invite" | | |
| B7 | Deny camera permission, then open the scanner | Explanation + manual-entry fallback | | |
| B8 | Join by typing the invite code | Joins the family | | |
| B9 | Send an email invitation | If SMTP is unset: says so, offers the code — **never** claims it emailed | | |
| B10 | With SMTP configured, send an invitation | Email actually arrives | | |
| B11 | Accept an emailed invitation on a second device | Joins the family | | |
| B12 | Reuse the same invitation link | Refused as already used | | |
| B13 | Change a member's role to guest | Role badge updates | | |
| B14 | As that guest, try to send a chat message | Refused, read-only message | | |
| B15 | As that guest, open events and memories | Can read them | | |

## C. Events, polling and smart date

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| C1 | Create an event | Appears in the list and calendar | | |
| C2 | Edit it | Changes persist after reopening | | |
| C3 | RSVP from a second device | Both devices show the RSVP | | |
| C4 | Add an event note | Saved, shows author and time | | |
| C5 | Create an availability poll with two dates | Poll appears | | |
| C6 | Vote from two devices | Counts update on both | | |
| C7 | Read the suggested date | Matches the votes, with a stated reason | | |
| C8 | Vote "no" on the leading option | Suggestion moves to the unblocked option | | |
| C9 | Close the poll | Chosen slot recorded | | |

## D. Celebrations and reminders

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| D1 | Add your date of birth to your profile | Saved | | |
| D2 | Open Celebrations | Your birthday appears, derived from the profile | | |
| D3 | Add an anniversary | Appears with a countdown | | |
| D4 | Add a cultural event | Appears | | |
| D5 | Delete a celebration you created | Removed | | |
| D6 | Set a birthday 1 day away, wait for the sweep | Reminder notification arrives | | |
| D7 | Confirm no duplicate arrives on the next sweep | Exactly one reminder | | |

## E. Memories

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| E1 | Upload a photo from the gallery | Appears for the family | | |
| E2 | Upload a photo from the camera | Appears | | |
| E3 | Upload a short video | Plays back | | |
| E4 | Upload with no connection | Clear error, no crash, no fake success | | |
| E5 | View a memory on a second device | Visible to the whole family | | |
| E6 | Delete a memory you uploaded | Removed on both devices | | |

## F. Chat

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| F1 | Send a message | Appears immediately | | |
| F2 | Receive on a second device | Arrives without a refresh | | |
| F3 | Mention a member with @ | Renders as a mention | | |
| F4 | Check the mentioned member's notifications | They were notified | | |
| F5 | Mention someone not in the family | Not turned into a mention | | |
| F6 | Send a photo, then a document | Both render and download | | |
| F7 | Pin a message | Pinned bar shows it on both devices | | |
| F8 | Edit a message to add a mention | Mention appears and notifies | | |
| F9 | Put the app in the background and return | Reconnects, no duplicates | | |
| F10 | Turn airplane mode on, send, turn it off | Handled without duplicates or loss | | |

## G. Languages

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| G1 | Switch to Sinhala | Login, dashboard, events, celebrations, register, join follow | | |
| G2 | Switch to Tamil | Same screens follow | | |
| G3 | Note any screen still in English | Expected on secondary screens — record which | | |
| G4 | Force-quit and reopen | Language persists | | |
| G5 | Check Sinhala and Tamil text is not clipped | Layout holds with longer strings | | |

## H. Elder Mode and voice

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| H1 | Enable Elder Mode | Larger type, larger targets, simpler navigation | | |
| H2 | Listen on opening the elder dashboard | Screen is announced aloud | | |
| H3 | Switch to Tamil or Sinhala in Elder Mode | Prompts speak that language | | |
| H4 | Turn spoken prompts off | Speech stops immediately | | |
| H5 | Switch back to standard mode | No speech at all | | |
| H6 | Use TalkBack / VoiceOver with Elder Mode on | App prompts do not fight the screen reader | | |
| H7 | Complete C1 (create an event) in Elder Mode | Achievable without help | | |

## I. Child accounts and consent

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| I1 | Register a child account and join the family | Told a guardian must approve | | |
| I2 | As the child, open chat / memories / events | Blocked, with the reason explained | | |
| I3 | As the child, view your own status | Shows "waiting for a guardian" | | |
| I4 | As admin, open Child approvals | The request is listed | | |
| I5 | Approve it | Child gains access | | |
| I6 | Reject it instead | Access closes again, distinct message | | |
| I7 | As the child, try to approve yourself | Refused | | |

## J. Security (adversarial, on device)

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| J1 | Sign in as a member of another family | Sees none of the first family's data | | |
| J2 | Guest attempts any write | Refused every time | | |
| J3 | Unapproved minor attempts any read | Refused with the consent code | | |
| J4 | Confirm no invite code is sent to a third-party service | QR is generated on-device | | |

---

## Summary

| Section | Pass | Fail | Blocked |
|---|---|---|---|
| A Authentication | | | |
| B Family and onboarding | | | |
| C Events and polling | | | |
| D Celebrations and reminders | | | |
| E Memories | | | |
| F Chat | | | |
| G Languages | | | |
| H Elder Mode and voice | | | |
| I Consent | | | |
| J Security | | | |
| **Total** | | | |

**Defects found:**

**Overall verdict:** ☐ Ready to submit ☐ Fix first — list blockers:
