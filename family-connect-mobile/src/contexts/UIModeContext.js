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
  uiModeSource: 'fc_ui_mode_source', // 'manual' | 'auto'
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
  // Child accounts are locked into minor mode by the account's memberType
  const [modeLocked, setModeLocked] = useState(false);
  const [modeSource, setModeSource] = useState('auto');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, t, src] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.uiMode),
          AsyncStorage.getItem(STORAGE_KEYS.themePref),
          AsyncStorage.getItem(STORAGE_KEYS.uiModeSource),
        ]);
        if (!cancelled) {
          if (m === 'standard' || m === 'minor' || m === 'elder') setUiModeState(m);
          if (t === 'light' || t === 'dark' || t === 'system' || t === 'highContrast') {
            setThemePreferenceState(t);
          }
          if (src === 'manual' || src === 'auto') setModeSource(src);
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
    setModeSource(source);
    await AsyncStorage.setItem(STORAGE_KEYS.uiMode, mode);
    await AsyncStorage.setItem(STORAGE_KEYS.uiModeSource, source);
  }, [modeLocked]);

  /**
   * Sync the UI mode with the account's server-side memberType:
   * - child  → forced into minor mode (locked)
   * - elder  → defaults to elder mode unless the user manually chose another
   * - adult  → unlock; a previously forced minor mode falls back to standard
   */
  const applyMemberType = useCallback(
    async (memberType) => {
      if (memberType === 'child') {
        setModeLocked(true);
        if (uiMode !== 'minor') {
          setUiModeState('minor');
          setModeSource('auto');
          await AsyncStorage.setItem(STORAGE_KEYS.uiMode, 'minor');
          await AsyncStorage.setItem(STORAGE_KEYS.uiModeSource, 'auto');
        }
        return;
      }
      setModeLocked(false);
      if (memberType === 'elder' && modeSource !== 'manual' && uiMode !== 'elder') {
        setUiModeState('elder');
        await AsyncStorage.setItem(STORAGE_KEYS.uiMode, 'elder');
      } else if ((!memberType || memberType === 'adult') && modeSource === 'auto' && uiMode === 'minor') {
        setUiModeState('standard');
        await AsyncStorage.setItem(STORAGE_KEYS.uiMode, 'standard');
      }
    },
    [uiMode, modeSource],
  );

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
      applyMemberType,
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
      applyMemberType,
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
