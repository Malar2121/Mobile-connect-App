# Family Connect — Language Support

## Supported Languages

| Code | Language | Locale tag | Script |
|------|----------|------------|--------|
| `en` | English | `en-US` | Latin |
| `ta` | Tamil | `ta-LK` | Tamil |
| `si` | Sinhala | `si-LK` | Sinhala |

## Architecture

```
src/i18n/
├── en.json          # Default bundle (always loaded)
├── ta.json          # Tamil (lazy-loaded on first use)
├── si.json          # Sinhala (lazy-loaded on first use)
└── index.js         # I18nProvider, useI18n(), setLocale()
```

### Provider

`I18nProvider` wraps the app inside `UIModeProvider` (`App.js`). It:

- Persists locale to AsyncStorage (`fc_locale`)
- Loads `ta` / `si` bundles on first selection (English eager-loaded)
- Memoizes context value to avoid unnecessary re-renders
- Exposes `t(key, params)` with `{{placeholder}}` interpolation

### Usage

```javascript
import { useI18n } from '../i18n';

function MyScreen() {
  const { t, locale, setLocale } = useI18n();
  return <Text>{t('profile.title')}</Text>;
}
```

### Date & number formatting

```javascript
import { useFormat } from '../hooks/useFormat';

const { formatDate, formatRelative, formatNumber, calendarWeekdays } = useFormat();
```

Utilities in `src/utils/i18nFormat.js` use BCP-47 locale tags (`ta-LK`, `si-LK`).

## Changing Language

**Profile → Language** → select:

- English
- தமிழ்
- සිංහල

Changes apply **immediately** without app restart. Tab labels update via `useTabConfig()`.

## Translation Coverage

| Area | Coverage |
|------|----------|
| Common actions | ✅ Full (en/ta/si) |
| Tab navigation | ✅ Full |
| Authentication (login) | ✅ Full |
| Profile / settings | ✅ Full |
| Language screen | ✅ Full |
| Dashboard greetings | ✅ Full |
| Map settings / SOS | ✅ Partial |
| Family / Events / Chat / Tree | ⚠️ Keys defined; screens migrating incrementally |
| Dynamic API content | N/A (user-generated, not translated) |

### Fallback behavior

If a key is missing in `ta` or `si`, English is used automatically.

## Adding Translations

1. Add key to `en.json`
2. Mirror key in `ta.json` and `si.json`
3. Replace hardcoded string with `t('your.key')`

Nested keys use dot notation: `t('profile.themeLight')`.

## Performance

- English bundle loaded at startup (~4KB JSON)
- Tamil/Sinhala loaded once on first switch, then cached in memory
- `t()` callback memoized on `[locale, bundleVersion]`
- `useTabConfig()` memoized on `[t]`

## Remaining Work

- Migrate remaining ~200 screens/components to `t()` keys
- Localize `RegisterScreen`, module home screens, empty states
- Pass `locale` into all `eventFormat` / `chatHelpers` call sites
- RTL support not required for ta/si (both LTR in this app)
