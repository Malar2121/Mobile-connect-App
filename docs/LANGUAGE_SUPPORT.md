# Family Connect — language support

Proposal §6.3: "Support English, Sinhala, and Tamil languages."

## Supported languages

| Code | Language | Locale tag | Script |
|------|----------|------------|--------|
| `en` | English | `en-US` | Latin |
| `si` | Sinhala | `si-LK` | Sinhala |
| `ta` | Tamil | `ta-LK` | Tamil |

Each bundle has **1,471 keys**, and the three are kept identical in shape by tests.

## Changing language

**Profile → Language** → English, සිංහල or தமிழ். The change applies at once,
without restarting, and is remembered on the phone. The app also tells the server,
so notifications follow the same choice.

---

## How it works in the app

```
src/i18n/
├── en.json      # English, loaded at start-up
├── si.json      # Sinhala, loaded the first time it is chosen
├── ta.json      # Tamil, loaded the first time it is chosen
└── index.js     # I18nProvider, useI18n(), translate(), getCurrentLocale()
```

`I18nProvider` stores the choice in AsyncStorage under `fc_locale`.

### In components

```javascript
import { useI18n } from '../i18n';

function MyScreen() {
  const { t } = useI18n();
  return <Text>{t('events.newEvent')}</Text>;
}
```

### Outside React

Helpers, services and module-level constants cannot call a hook. They use
`translate()`, which reads the current language:

```javascript
import { translate } from '../i18n';

export const RSVP_LABEL = {
  get accepted() { return translate('events.rsvpLabel.accepted'); },
};
```

A **getter** matters here. A plain `label: translate('…')` would be evaluated once,
when the file loads, and would stay in that language.

### Interpolation

`{{name}}` placeholders: `t('family.joinedDate', { date })`. There are no plural
rules; where a count changes the wording, there are separate keys.

### What stays untranslated

- **Words people write:** names, messages, captions, stories, event titles. They
  are shown exactly as written, in any script.
- **Data:** route names, relationship nicknames that are stored and matched
  (`Father`, `Mother`), status codes. The label shown for them is translated.
- **Text sent on a member's behalf** when a field is left blank (the SOS message,
  the voice message label, a scheduled message). It is written in the
  **sender's** language.
- **Language-neutral examples:** the invite code pattern `ABCD-EFGH` and example
  email addresses.

---

## Server-side text

- **Notifications and push messages.** `User.language` (`en`, `si`, `ta`) is set
  by the app after sign-in and whenever the language changes (`PATCH /api/auth/me`).
  `backend/services/notificationText.js` writes each notification's title and body
  in the recipient's language.
- **API errors.** `src/services/apiError.js` maps an error's `code`
  (`GUEST_READ_ONLY`, `MEDIA_QUOTA_EXCEEDED`, …) or its HTTP status to a translated
  message. English readers see the server's own wording.

---

## Automated guards

All of these run with the backend suite (`cd backend && npm test`).

| Test | Fails when |
|---|---|
| `tests/unit/i18nBundles.test.js` | A key is missing from a language; placeholders differ; a Sinhala or Tamil value is copied English, empty, or lacks its own script |
| `tests/unit/i18nUsage.test.js` | A `t()` or `translate()` key does not exist; a file calls `t()` without obtaining it; fewer screens are localised than before |
| `tests/unit/i18nHardcoded.test.js` | English appears in JSX text, a user-facing prop or key, an alert or toast, a template literal, or **as a phrase anywhere** in the app code |
| `tests/unit/mobileScope.test.js` | `t` is used where it is not defined or has been shadowed, or translated text is used as a route name or stored value |
| `tests/unit/notificationText.test.js` | A notification type cannot be written in all three languages |

The hardcoded-English and scope tests each include a self-test, proving they
catch the mistake they are meant to catch.

## Adding text

1. Add the key to `en.json`, `si.json` and `ta.json`, with the same placeholders.
2. Use `t('section.key')` in a component, or a `translate()` getter elsewhere.
3. Run the guards:

```bash
cd backend && npx jest tests/unit
```

---

## Known limitations

- **No fluent-speaker review.** The Sinhala and Tamil text has not been checked
  by a native speaker. Do that before a pilot.
- **Fonts.** The Inter typeface has no Sinhala or Tamil glyphs, so Android uses a
  system font for those scripts. Line height and clipping need checking on a
  phone (`DEVICE_TEST_MATRIX.md`, LANG-05 and LANG-06).
- **Voice prompts** in Sinhala or Tamil depend on the phone having those
  text-to-speech voices installed.
- Sinhala and Tamil are left-to-right, so no right-to-left layout is needed.
