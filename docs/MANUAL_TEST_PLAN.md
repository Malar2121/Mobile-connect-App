# Manual acceptance test plan — physical device

> **Why this exists.** Everything in this project has been verified on the
> server side by automated tests, and the mobile code by static analysis and an
> Android bundle build. **The app has not been run on a physical device.** That
> gap is real and this checklist closes it.
>
> This is the short acceptance checklist. The detailed two-phone version, with
> accounts, files and step-by-step procedures, is `DEVICE_TEST_MATRIX.md`.
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
| A6 | Enable 2FA, sign out, sign in | Prompts for the code and accepts it | | |

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
| B9 | Send an email invitation without SMTP | Says it was not emailed and offers the invitation — **never** claims it emailed | | |
| B10 | **Second device:** register with the invited address and paste the invitation into Join a family | Joins the family | | |
| B11 | Paste the same invitation again | Refused as already used | | |
| B12 | With SMTP configured, send an invitation | Email actually arrives | | BLOCKED until SMTP is configured |
| B13 | Change a member's role to guest | Role badge updates | | |
| B14 | As that guest, try to send a chat message | Refused, read-only message | | |
| B15 | As that guest, open events, memories and stories | Can read them | | |

## C. Events, polling and smart date

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| C1 | Create an event; first try the title step with no title | Clear message, no crash; then the event appears in the list and calendar | | |
| C2 | Edit it | Changes persist after reopening | | |
| C3 | RSVP from a second device | Both devices show the RSVP after refreshing | | |
| C4 | Add an event note | Saved, shows author and time | | |
| C5 | Create an availability poll with two dates | Poll appears | | |
| C6 | Vote from two devices | Counts match on both after reopening | | |
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
| D6 | Set another member's birthday 1 day away, wait for the sweep | Reminder notification arrives for you | | Run between 06:00 and 23:30 |
| D7 | Confirm no duplicate arrives on the next sweep | Exactly one reminder | | |

## E. Memories

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| E1 | Upload a photo from the gallery | Shown to you as waiting for approval | | |
| E2 | **Second device:** approve it from Review | Visible to the whole family after refreshing | | |
| E3 | Reject another upload with a reason | Uploader is told why; the family never sees it | | |
| E4 | Look for your own upload in Review | Not offered to you | | |
| E5 | Upload as the only adult in a family | Shared straight away | | |
| E6 | Upload a photo from the camera | Appears (waiting) | | |
| E7 | Upload a short video | Plays back after approval | | |
| E8 | Upload a video over 10 MB | "That file is too large", no crash, no fake success | | |
| E9 | Upload with no connection | Clear error, no crash, no fake success | | |
| E10 | Delete a memory you uploaded | Removed on both devices | | |

## F. Stories and family journal

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| F1 | Memories → Stories → share a story in Sinhala or Tamil | Appears for the family with identical text | | |
| F2 | As another member, open that story | No edit or delete option, or refused | | |
| F3 | As admin, edit then delete it | Both work | | |
| F4 | Family tree → Journal: fill two fields, save | **Second device** sees the same text after refreshing | | |
| F5 | As a guest, try to edit the journal | Refused, read-only | | |

## G. Chat

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| G1 | Send a message | Appears immediately | | |
| G2 | Receive on a second device | Arrives without a refresh | | |
| G3 | Mention a member with @ | Renders as a mention | | |
| G4 | Check the mentioned member's notifications | They were notified | | |
| G5 | Mention someone not in the family | Not turned into a mention | | |
| G6 | Edit a message to add a mention | Mention appears and notifies once | | |
| G7 | Send a photo, then a document | Both render and open | | |
| G8 | Send a file over 10 MB | "That file is too large" | | |
| G9 | Pin a message | Pinned bar shows it on both devices | | |
| G10 | Put the app in the background and return | Reconnects, no duplicates | | |
| G11 | Turn airplane mode on, send, turn it off | Handled without duplicates or loss | | |

## H. Languages

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| H1 | Switch to Sinhala and walk every tab | Whole interface in Sinhala | | |
| H2 | Switch to Tamil and walk every tab | Whole interface in Tamil | | |
| H3 | Note any app text still in English | **None expected** — record each as a defect | | |
| H4 | With the language set, receive a new notification | Written in that language | | |
| H5 | Force-quit and reopen | Language persists | | |
| H6 | Check Sinhala and Tamil text is not clipped | Layout holds with longer strings | | |
| H7 | Set a relationship in English, view it in Tamil | Shown in Tamil; same relationship | | |

## I. Elder Mode and voice

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| I1 | Enable Elder Mode | Larger type, larger targets, simpler navigation | | |
| I2 | Listen on opening the elder dashboard | Screen is announced aloud | | |
| I3 | Switch to Tamil or Sinhala in Elder Mode | Prompts speak that language (if the phone has the voice) | | |
| I4 | Turn spoken prompts off | Speech stops immediately | | |
| I5 | Switch back to standard mode | No speech at all | | |
| I6 | Use TalkBack with Elder Mode on | App prompts do not fight the screen reader | | |
| I7 | Complete C1 (create an event) in Elder Mode | Achievable without help | | |

## J. Child accounts and consent

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| J1 | Register a child account and join the family | Told a guardian must approve | | |
| J2 | As the child, open chat / memories / events | Blocked, with the reason explained | | |
| J3 | As the child, view your own status | Shows "waiting for a guardian" | | |
| J4 | As admin, open Child approvals | The request is listed | | |
| J5 | Approve it | Child gains access | | |
| J6 | Reject it instead | Access closes again, distinct message | | |
| J7 | As the child, try to approve yourself | Refused | | |

## K. Security (adversarial, on device)

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| K1 | Sign in as a member of another family | Sees none of the first family's data, stories or memories | | |
| K2 | Guest attempts any write | Refused every time | | |
| K3 | Unapproved minor attempts any read | Refused with the consent explanation | | |
| K4 | Push notifications with the app closed | System notification arrives | | BLOCKED until Firebase and a native build |

---

## Summary

| Section | Pass | Fail | Blocked |
|---|---|---|---|
| A Authentication | | | |
| B Family and onboarding | | | |
| C Events and polling | | | |
| D Celebrations and reminders | | | |
| E Memories | | | |
| F Stories and journal | | | |
| G Chat | | | |
| H Languages | | | |
| I Elder Mode and voice | | | |
| J Consent | | | |
| K Security | | | |
| **Total** | | | |

**Defects found:**

**Overall verdict:** ☐ Ready to submit ☐ Fix first — list blockers:
