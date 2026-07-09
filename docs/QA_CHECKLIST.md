# Family Connect — Final QA Checklist (RC2)

Use this checklist before promoting `1.0.0-rc.2` to GA. Test on a physical Android device where noted.

---

## Authentication

- [ ] Register new account with valid email/password
- [ ] Login with valid credentials
- [ ] Login with invalid credentials shows error (no crash)
- [ ] Token persists after app restart (auto-login)
- [ ] Logout clears session and returns to auth screen
- [ ] Expired token triggers refresh or re-login
- [ ] Deactivated account shows 403 message

## Dashboard

- [ ] Dashboard loads with family data
- [ ] Loading skeleton shown on first load
- [ ] Empty state when no family joined
- [ ] Quick actions navigate to correct modules
- [ ] Pull-to-refresh updates stats
- [ ] Offline banner appears when API unreachable
- [ ] Recent events/memories sections render or show empty state

## Family

- [ ] Create family flow completes
- [ ] Join family by invite code works
- [ ] Member list displays avatars and names
- [ ] Invite member sends request (or shows appropriate message)
- [ ] Leave family with confirmation dialog
- [ ] Member profile screen opens
- [ ] Family settings screens open (even if backend-limited)
- [ ] Back navigation returns to profile/family home

## Events

- [ ] Events list loads with loading/empty/error states
- [ ] Create event form validates required fields
- [ ] Event details screen shows RSVP controls
- [ ] RSVP updates reflect in UI
- [ ] Poll creation and voting (if event has poll)
- [ ] Delete event shows confirmation
- [ ] Calendar/date picker works on device

## Memories

- [ ] Memories grid loads photos/videos
- [ ] Upload photo from gallery
- [ ] Upload shows progress / success toast
- [ ] Memory details screen opens
- [ ] Like/unlike toggles
- [ ] Album list and album detail navigation
- [ ] Timeline groups by year/month
- [ ] Search filters memories

## Family Tree

- [ ] Tree home loads graph from API
- [ ] Pan/zoom tree visualization
- [ ] Person node tap opens profile
- [ ] Heritage timeline renders
- [ ] Descendants view navigates
- [ ] Tree settings screen accessible
- [ ] Error state on API failure

## Chat

- [ ] Chat home / conversation loads messages
- [ ] Send text message (appears for sender and receiver)
- [ ] Real-time receive on second device/emulator
- [ ] Typing indicator appears
- [ ] Read receipts update
- [ ] Send image attachment
- [ ] Edit message
- [ ] Delete message with confirmation
- [ ] React to message
- [ ] Pin / unpin message
- [ ] Star message; starred list shows it
- [ ] Search messages
- [ ] Pinned banner shows pinned messages
- [ ] No loading flash when returning to chat with messages loaded

## Map

- [ ] Live map shows family member markers
- [ ] Own location updates when sharing enabled
- [ ] Member details screen from marker tap
- [ ] Safe zones CRUD (local storage)
- [ ] SOS triggers confirmation and alert
- [ ] Emergency contacts list (local storage)
- [ ] Location settings persist
- [ ] Trip history screen loads local data
- [ ] Real-time location update via socket on second device
- [ ] No loading flash when returning with map data loaded

## Notifications

- [ ] Notification list loads
- [ ] Mark as read updates badge/state
- [ ] Delete notification
- [ ] Push notification received (physical device)
- [ ] Tap notification navigates to relevant screen

## Settings & Profile

- [ ] Profile shows user info
- [ ] Edit profile saves
- [ ] Theme toggle (light/dark/system)
- [ ] UI mode switch (standard/minor/elder) changes font scale
- [ ] Elder mode has larger touch targets
- [ ] App does not crash on font load failure (fallback fonts)

## Cross-Cutting

- [ ] All tab bar items navigate correctly
- [ ] Back button works on every stack screen
- [ ] No `console.log` in production mobile build
- [ ] Toast shown on successful mutations
- [ ] Confirm dialog on destructive actions
- [ ] App handles airplane mode gracefully (offline banner)
- [ ] No infinite loading spinners
- [ ] No unhandled promise rejection crashes

## Accessibility (spot check)

- [ ] Screen reader announces offline banner
- [ ] Primary buttons have minimum 44pt touch area in elder mode
- [ ] Text scales with system font size where supported

## Security (spot check)

- [ ] API returns 401 without token on protected route
- [ ] Cannot access another family's data by ID manipulation
- [ ] No secrets in mobile bundle (only `EXPO_PUBLIC_*`)
- [ ] Auth 500 does not leak stack trace to client

## Regression (from 2026-07-03 release audit — verify fixed defects)

- [ ] Memories → Gallery opens without crashing when memories exist (TDZ crash fixed)
- [ ] Map → SOS: countdown 5→0 and alert actually sends; cancel aborts (was fully broken)
- [ ] Chat: many messages do NOT trigger full-history refetch per message
- [ ] Map: a member moving does NOT trigger full family-locations refetch per update
- [ ] Memories → Details → Like works while profile still hydrating (no null crash)
- [ ] Chat search with regex metacharacters returns literal matches, no 500
- [ ] Notifications: `POST /notifications/create` rejected for non-admin members (open gap)
- [ ] Family Tree: open tree for a newly created (non-seeded) family — confirm nodes appear (currently empty)

---

**Sign-off**

| Role | Name | Date | Pass/Fail |
|------|------|------|-----------|
| Developer | | | |
| QA | | | |
| Product | | | |
