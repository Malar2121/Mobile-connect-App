import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'fc_locale';

/** @typedef {'en' | 'ta' | 'si'} Locale */

export const SUPPORTED_LOCALES = [
  { id: 'en', labelKey: 'language.english', nativeLabel: 'English' },
  { id: 'ta', labelKey: 'language.tamil', nativeLabel: 'தமிழ்' },
  { id: 'si', labelKey: 'language.sinhala', nativeLabel: 'සිංහල' },
];

const LOCALE_TAGS = { en: 'en-US', ta: 'ta-LK', si: 'si-LK' };

export { LOCALE_TAGS };

/** English bundle always in memory; others loaded on first use. */
const enBundle = require('./en.json');
const lazyBundles = {
  ta: () => require('./ta.json'),
  si: () => require('./si.json'),
};

const bundleCache = { en: enBundle };

function loadBundle(locale) {
  if (bundleCache[locale]) return bundleCache[locale];
  if (locale === 'ta' || locale === 'si') {
    bundleCache[locale] = lazyBundles[locale]();
  }
  return bundleCache[locale] ?? enBundle;
}

function getNested(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function interpolate(str, params) {
  if (!params || typeof str !== 'string') return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{{${key}}}`,
  );
}

const I18nContext = createContext({
  locale: 'en',
  localeTag: 'en-US',
  setLocale: async () => {},
  t: (key) => key,
  ready: false,
});

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(/** @type {Locale} */ ('en'));
  const [ready, setReady] = useState(false);
  const [bundleVersion, setBundleVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && (stored === 'en' || stored === 'ta' || stored === 'si')) {
          loadBundle(stored);
          setGlobalLocale(stored);
          setLocaleState(stored);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback(async (next) => {
    if (next !== 'en' && next !== 'ta' && next !== 'si') return;
    loadBundle(next);
    setLocaleState(next);
    setGlobalLocale(next);
    setBundleVersion((v) => v + 1);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key, params) => {
      const bundle = loadBundle(locale);
      const fallback = getNested(enBundle, key);
      const val = getNested(bundle, key) ?? fallback ?? key;
      if (typeof val === 'string') return interpolate(val, params);
      return key;
    },
    [locale, bundleVersion],
  );

  const localeTag = LOCALE_TAGS[locale] ?? 'en-US';

  const value = useMemo(
    () => ({ locale, localeTag, setLocale, t, ready }),
    [locale, localeTag, setLocale, t, ready],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

/** Non-hook accessor for format utilities. */
export function getLocaleTag() {
  return LOCALE_TAGS[global.__fcLocale ?? 'en'] ?? 'en-US';
}

export function setGlobalLocale(locale) {
  global.__fcLocale = locale;
}
