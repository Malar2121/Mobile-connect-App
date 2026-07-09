# Family Connect — WCAG 2.1 Checklist

Reference: [WCAG 2.1 Level AA](https://www.w3.org/TR/WCAG21/) (target for proposal alignment)

## Perceivable

| Criterion | Status | Notes |
|-----------|--------|-------|
| 1.1.1 Non-text Content | Partial | Images have `accessibilityLabel` in design-system + key screens; not all user media |
| 1.3.1 Info and Relationships | Partial | Headers, tabs, buttons use roles; some lists lack full structure |
| 1.3.2 Meaningful Sequence | Pass | Standard top-to-bottom scroll layouts |
| 1.4.1 Use of Color | Pass | Status also conveyed with text/icons |
| 1.4.3 Contrast (Minimum) | Partial | Standard themes meet ~4.5:1; HC mode improves further |
| 1.4.4 Resize Text | Pass | Elder mode + system font scaling via `fontScale` |
| 1.4.10 Reflow | Pass | Responsive padding, scroll views |
| 1.4.11 Non-text Contrast | Partial | HC mode improves control borders |
| 1.4.12 Text Spacing | Pass | Spacing tokens, elder mode gaps |
| 1.4.13 Content on Hover/Focus | N/A | Mobile-first |

## Operable

| Criterion | Status | Notes |
|-----------|--------|-------|
| 2.1.1 Keyboard | N/A | Touch-primary; external keyboard partial via RN |
| 2.1.2 No Keyboard Trap | Pass | Modals dismissible |
| 2.4.1 Bypass Blocks | N/A | Mobile app |
| 2.4.2 Page Titled | Partial | Screen titles via PageHeader; not all announced |
| 2.4.3 Focus Order | Partial | Native focus order; not manually audited on all screens |
| 2.4.4 Link Purpose | Pass | Auth links labeled |
| 2.5.1 Pointer Gestures | Pass | Simple tap targets; tree pan is optional |
| 2.5.2 Pointer Cancellation | Pass | Pressable with release cancel |
| 2.5.3 Label in Name | Partial | Most buttons match visible text |
| 2.5.4 Motion Actuation | Pass | No shake-to-activate |
| 2.5.5 Target Size | Pass | 44pt standard, 60pt elder |

## Understandable

| Criterion | Status | Notes |
|-----------|--------|-------|
| 3.1.1 Language of Page | Pass | `locale` drives UI strings; user content unchanged |
| 3.1.2 Language of Parts | Partial | Tamil/Sinhala UI; mixed-language user names OK |
| 3.2.1 On Focus | Pass | No unexpected context change on focus |
| 3.2.2 On Input | Pass | Forms don't auto-submit |
| 3.3.1 Error Identification | Partial | Auth errors shown in text; not all forms |
| 3.3.2 Labels or Instructions | Pass | TextField labels on auth/profile |
| 3.3.3 Error Suggestion | Partial | Server messages shown as-is |

## Robust

| Criterion | Status | Notes |
|-----------|--------|-------|
| 4.1.1 Parsing | Pass | React Native components |
| 4.1.2 Name, Role, Value | Partial | Primitives + tabs; incremental screen audit |
| 4.1.3 Status Messages | Partial | Toast + offline banner use live regions |

## Summary

| Level | Estimate |
|-------|----------|
| WCAG A | ~85% aligned |
| WCAG AA | ~72% aligned |
| WCAG AAA | Not targeted |

## Priority Gaps

1. Complete `accessibilityLabel` on all interactive elements
2. Full i18n migration (removes English-only barriers for ta/si users)
3. Formal contrast audit of standard (non-HC) dark theme
4. Screen reader walkthrough per module with TalkBack/VoiceOver scripts
5. Error message localization

## Verification Script

1. Profile → Language → தமிழ் — tab labels change
2. Profile → High contrast — borders/text strengthen
3. Profile → Elder — touch targets grow
4. Profile → Minor — SOS screen shows restriction alert
5. System Settings → Remove animations — tab bar stops springing
6. TalkBack: traverse Login → tabs → Profile → Language radio group
