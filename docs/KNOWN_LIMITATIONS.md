# Family Connect — Known Limitations

Documented gaps between mobile UI and backend capabilities. These are intentional placeholders for future backend work — not bugs in navigation.

## Backend Gaps (UI prepared, API pending)

### Family Module
- Join request approval workflow (`JoinRequestsScreen`)
- Granular role/permission management (`FamilyRolesScreen`, `FamilyPermissionsScreen`)
- Relationship graph editing (`RelationshipScreen`)
- Extended member profile fields (`MemberProfileScreen`)

### Events Module
- Event attachments file storage (`EventAttachmentsScreen`)
- Push reminder scheduling (`EventReminderScreen`)
- Recurring events

### Memories Module
- Geo-tagged memory map (`MemoryMapScreen`)
- Legacy mode archival workflows (`LegacyModeScreen`)
- Server-side view counts (currently client AsyncStorage)

### Family Tree Module
- Full CRUD for persons and relationships (`PersonProfileScreen`, `RelationshipEditorScreen`)
- Server-persisted legacy profiles (`LegacyProfilesScreen`)

### Chat Module
- Server-side chat settings (`ChatSettingsScreen`)
- Dedicated voice message pipeline (`VoiceMessageScreen` — uses media upload path partially)

### Map Module
- Server-persisted safe zones (`SafeZonesScreen` — AsyncStorage only)
- Server-persisted emergency contacts (`EmergencyContactsScreen`)
- Trip/driving history from GPS backend (`TripHistoryScreen`, `DrivingHistoryScreen`)
- Place geocoding details (`PlaceDetailsScreen`)
- Geofence enter/exit notifications

## Client-Side Only Data

| Data | Storage | Notes |
|------|---------|-------|
| Safe zones | AsyncStorage | Per user |
| Emergency contacts | AsyncStorage | Per user |
| SOS history | AsyncStorage | Local log |
| Trip points | AsyncStorage | No server sync |
| Location settings | AsyncStorage | Sharing preferences |
| Memory view counts | AsyncStorage | Analytics approximation |
| Legacy profiles (memories) | AsyncStorage | Until API exists |

## Performance

- **Duplicate API calls**: Dashboard, Family, and Map hooks each fetch `getFamilyLocations()`. Dashboard and module hooks independently fetch events/memories. Acceptable for MVP; shared cache layer recommended for v1.1.
- **No request deduplication**: Parallel tab focus can trigger overlapping fetches.
- **FlatList optimization**: Most lists use `keyExtractor`; `getItemLayout` not universally applied.

## Offline

- Offline banner and queue **architecture** is in place (`NetworkContext`, `offlineQueue.js`).
- Queue processors are not yet registered per domain — mutating actions fail immediately when offline.
- Read-only cached data is not served from a unified cache (hooks hold in-memory state only).

## Accessibility

- `accessibilityLabel` added incrementally; not every interactive element is labeled.
- Elder/minor UI modes adjust scale; full VoiceOver audit not completed.
- Color contrast generally meets WCAG in light/dark themes; not formally certified.

## Security

- `CLIENT_URL=*` in development allows any origin; must be restricted in production.
- Refresh token rotation is implemented; no device binding.
- No certificate pinning on mobile.
- File upload MIME validation relies on server middleware; client does not pre-validate all media types.

## Testing

- No automated E2E or unit test suite in CI.
- Manual QA checklist provided in `docs/QA_CHECKLIST.md`.

## Platform

- iOS build scripts exist but primary dev target is Android emulator.
- Web target (`expo start --web`) is not production-tested.
- Push notifications require physical device + Firebase configuration.
