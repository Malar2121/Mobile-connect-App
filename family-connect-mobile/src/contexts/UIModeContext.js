import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AccessibilityInfo, Appearance, useColorScheme as useRNColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveTheme } from '../design-system/theme/resolveTheme';

export const UIModeContext = createContext(undefined);

const STORAGE_KEYS = {
  uiMode: 'fc_ui_mode', // last mode on this device, only for the first render before sign-in resolves
  themePref: 'fc_theme_pref',
  // The old device-wide 'fc_ui_mode_source' key is ignored: it made one person's choice stick for everyone.
};
// A mode picked in Profile belongs to that account only.
const modePrefKey = (userId) => `fc_ui_mode_pref:${userId}`;
const isMode = (m) => m === 'standard' || m === 'minor' || m === 'elder';

/** @typedef {'standard' | 'minor' | 'elder'} UIMode */
/** @typedef {'light' | 'dark' | 'system' | 'highContrast'} ThemePreference */

export function UIModeProvider({ children }) {
  const systemScheme = useRNColorScheme();
  const [uiMode, setUiModeState] = useState(/** @type {UIMode} */ ('standard'));
  const [themePreference, setThemePreferenceState] = useState(
    /** @type {ThemePreference} */ ('system'),
  );
  const [reduceMotion, setReduceMotion] = useState(false);
  const [ready, setReady] = useState(false);
  // Child accounts are locked into minor mode by the account's memberType
  const [modeLocked, setModeLocked] = useState(false);
  const accountIdRef = useRef(null); // signed-in user whose manual choice setUiMode saves
  const applySeq = useRef(0); // ignores a slower, older applyAccount when accounts switch quickly

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, t] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.uiMode),
          AsyncStorage.getItem(STORAGE_KEYS.themePref),
        ]);
        if (!cancelled) {
          if (isMode(m)) setUiModeState(m);
          if (t === 'light' || t === 'dark' || t === 'system' || t === 'highContrast') {
            setThemePreferenceState(t);
          }
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const isHighContrast = themePreference === 'highContrast';

  const resolvedScheme =
    themePreference === 'system' || themePreference === 'highContrast'
      ? systemScheme ?? Appearance.getColorScheme() ?? 'light'
      : themePreference;

  const theme = useMemo(
    () => resolveTheme(resolvedScheme, uiMode, { highContrast: isHighContrast }),
    [resolvedScheme, uiMode, isHighContrast],
  );

  const setUiMode = useCallback(async (mode, { source = 'manual' } = {}) => {
    // A child account cannot switch itself out of minor mode
    if (modeLocked && mode !== 'minor' && source === 'manual') return;
    setUiModeState(mode);
    await AsyncStorage.setItem(STORAGE_KEYS.uiMode, mode);
    // A manual choice is remembered for the signed-in account only.
    if (source === 'manual' && accountIdRef.current) {
      await AsyncStorage.setItem(modePrefKey(accountIdRef.current), mode);
    }
  }, [modeLocked]);

  /**
   * Set the UI mode for the signed-in account (null when signed out):
   * - child  → forced into minor mode (locked)
   * - others → their own saved Profile choice if any, otherwise elder for
   *            elder accounts (memberType or server elderMode) and standard for adults
   * - signed out → standard for the login screens; saved choices are kept
   */
  const applyAccount = useCallback(async (account) => {
    applySeq.current += 1;
    const seq = applySeq.current;
    accountIdRef.current = account?.id ?? null;

    let mode = 'standard';
    if (account?.memberType === 'child') {
      mode = 'minor';
    } else if (account) {
      const saved = await AsyncStorage.getItem(modePrefKey(account.id)).catch(() => null);
      if (seq !== applySeq.current) return;
      if (isMode(saved)) mode = saved;
      else if (account.memberType === 'elder' || account.elderMode === true) mode = 'elder';
    }

    setModeLocked(account?.memberType === 'child');
    setUiModeState(mode);
    await AsyncStorage.setItem(STORAGE_KEYS.uiMode, mode);
  }, []);

  const setThemePreference = useCallback(async (pref) => {
    setThemePreferenceState(pref);
    await AsyncStorage.setItem(STORAGE_KEYS.themePref, pref);
  }, []);

  const toggleTheme = useCallback(async () => {
    const next = resolvedScheme === 'dark' ? 'light' : 'dark';
    await setThemePreference(next);
  }, [resolvedScheme, setThemePreference]);

  const value = useMemo(
    () => ({
      uiMode,
      setUiMode,
      applyAccount,
      modeLocked,
      themePreference,
      setThemePreference,
      resolvedScheme,
      isHighContrast,
      reduceMotion,
      ...theme,
      colors: theme.colors,
      layout: theme.layout,
      isDark: theme.isDark,
      toggleTheme,
      ready,
      theme,
    }),
    [
      uiMode,
      setUiMode,
      applyAccount,
      modeLocked,
      themePreference,
      setThemePreference,
      resolvedScheme,
      isHighContrast,
      reduceMotion,
      theme,
      toggleTheme,
      ready,
    ],
  );

  return <UIModeContext.Provider value={value}>{children}</UIModeContext.Provider>;
}

export function useUIMode() {
  const ctx = useContext(UIModeContext);
  if (!ctx) throw new Error('useUIMode must be used within UIModeProvider');
  return ctx;
}
