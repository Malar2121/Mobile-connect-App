import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AccessibilityInfo, Appearance, useColorScheme as useRNColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveTheme } from '../design-system/theme/resolveTheme';

export const UIModeContext = createContext(undefined);

const STORAGE_KEYS = {
  uiMode: 'fc_ui_mode',
  themePref: 'fc_theme_pref',
};

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, t] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.uiMode),
          AsyncStorage.getItem(STORAGE_KEYS.themePref),
        ]);
        if (!cancelled) {
          if (m === 'standard' || m === 'minor' || m === 'elder') setUiModeState(m);
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

  const setUiMode = useCallback(async (mode) => {
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
