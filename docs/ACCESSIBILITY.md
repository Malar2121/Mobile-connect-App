# Family Connect — Accessibility Guide

## Overview

Family Connect is designed for **children**, **adults**, and **elderly users** through layered accessibility: UI modes, high-contrast themes, reduced motion, screen-reader labels, and centralized policy gates.

## UI Modes

| Mode | Purpose | Key changes |
|------|---------|-------------|
| **Standard** | Default adults | 44pt min touch, 1× font scale |
| **Minor** | Children | Hides sensitive media, restricts admin/location/SOS, suppresses chat notifications |
| **Elder** | Older adults | 1.24× font, 60pt touch, 64px avatars, increased spacing, simplified density |

Configure under **Profile → Accessibility**.

## High Contrast Theme

**Profile → Appearance → High contrast** applies WCAG-oriented palettes:

- Light HC: black text on white, solid borders
- Dark HC: white/yellow on black, maximum separation

Uses design-system tokens (`highContrastLightSemantic`, `highContrastDarkSemantic`).

## Reduced Motion

The app reads `AccessibilityInfo.isReduceMotionEnabled()` and exposes `reduceMotion` via `UIModeContext` / `useMotion()`.

When enabled:

- Tab bar spring animations disabled
- Dashboard greeting fade-in skipped
- Confirm dialog zoom entrance skipped
- Button press scale transform removed

## Screen Reader Support

### Design-system primitives

All interactive primitives include baseline labels:

- `Button` — `accessibilityRole="button"`, label from title
- `Chip` — `accessibilityState.selected`
- `TextField` — label + hint
- `IconButton`, `FAB`, `Avatar` — configurable labels
- `PageHeader` — back button labeled
- `ConfirmDialog` — `accessibilityViewIsModal`, `accessibilityRole="alert"`
- `OfflineBanner` — `accessibilityLiveRegion="polite"`

### Navigation

- Tab bar items use `accessibilityRole="tab"` with `accessibilityState.selected`
- Stack screens use `PageHeader` `onBack` with back label

### Module coverage

| Module | Status |
|--------|--------|
| Authentication | Login i18n + labels |
| Dashboard | Greeting header, reduced-motion hero |
| Profile / Settings | Full i18n, language, theme, modes |
| Map | Location settings switches, SOS alert |
| Memories | Minor media filter, grid labels |
| Chat | Existing bubble/header labels |
| Family / Events / Tree | Component-level labels (partial) |
| Notifications | Minor chat filter (existing) |

## Minor Mode Policies

Centralized in `src/utils/accessibilityPolicy.js`:

| Action | Allowed in minor mode |
|--------|----------------------|
| View filtered memories | Yes (non-sensitive) |
| Upload media | No |
| Admin invite code | No |
| Location sharing | No |
| High-precision GPS | No |
| SOS trigger | No |
| Chat push notifications | No |

Use `useAccessibilityPolicy()` in screens.

## Elder Mode Enhancements

Token changes in `uiModeLayout.elder`:

- `fontScale: 1.24`
- `minTouch: 60`
- `avatarSize: 64`
- `sectionGap` increased
- `buttonScale: 1.12` for larger CTAs

## Testing Checklist

1. Enable **TalkBack** (Android) or **VoiceOver** (iOS)
2. Navigate all tabs — verify tab announcements
3. Switch to **Elder** — verify larger controls
4. Switch to **Minor** — verify SOS/location/admin blocked
5. Enable **High contrast** — verify readable text/borders
6. Enable system **Remove animations** — verify no spring/tab bounce
7. Change language to Tamil/Sinhala — verify tab labels and profile strings

## Files Reference

| File | Role |
|------|------|
| `contexts/UIModeContext.js` | Theme, modes, reduced motion |
| `utils/accessibilityPolicy.js` | Minor/elder policy rules |
| `hooks/useAccessibilityPolicy.js` | React hook |
| `hooks/useMotion.js` | Motion helpers |
| `design-system/tokens/spacing.js` | Mode layout tokens |
| `design-system/tokens/colors.js` | High-contrast palettes |
