import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { useTheme } from './useTheme';
import { useI18n, LOCALE_TAGS } from '../i18n';

const STORAGE_KEY = 'fc_voice_prompts';

/**
 * Spoken prompts for Elder Mode (proposal §6.3).
 *
 * Deliberately narrow: this reads out the screen a user has arrived at and
 * confirms important actions. It is not a screen reader — the platform already
 * provides one, and duplicating it would talk over VoiceOver/TalkBack.
 *
 * Off unless the user is in elder mode AND has left the setting on, so it can
 * never start talking on a standard account. Speech is also spoken in the
 * app's current language, so a Tamil or Sinhala user is not read to in English.
 */
export function useVoicePrompts() {
  const { uiMode } = useTheme();
  const { locale, t } = useI18n();
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const lastSpoken = useRef('');

  const isElder = uiMode === 'elder';

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        // Default ON for elder mode — the feature exists for elders, and an
        // elder should not have to find a setting to get the help.
        if (alive) setEnabled(stored === null ? true : stored === 'true');
      } catch {
        if (alive) setEnabled(true);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Never leave speech running when the feature is turned off or the user
  // leaves elder mode.
  useEffect(() => {
    if (!isElder || !enabled) Speech.stop();
  }, [isElder, enabled]);

  useEffect(() => () => Speech.stop(), []);

  const active = ready && isElder && enabled;

  const speak = useCallback(
    (text, { interrupt = true } = {}) => {
      if (!active || !text) return;
      try {
        if (interrupt) Speech.stop();
        Speech.speak(String(text), {
          language: LOCALE_TAGS[locale] ?? 'en-US',
          rate: 0.9, // a little slower than default, which elders test better with
          pitch: 1.0,
        });
      } catch {
        // Speech is an enhancement — never let a TTS failure break a screen.
      }
    },
    [active, locale],
  );

  /** Announce a screen once; repeated calls with the same text stay silent. */
  const announceScreen = useCallback(
    (text) => {
      if (!active || !text) return;
      if (lastSpoken.current === text) return;
      lastSpoken.current = text;
      speak(text);
    },
    [active, speak],
  );

  /** Speak a translation key, so prompts follow the selected language. */
  const speakKey = useCallback((key, params) => speak(t(key, params)), [speak, t]);

  const setPromptsEnabled = useCallback(async (value) => {
    setEnabled(value);
    if (!value) Speech.stop();
    try {
      await AsyncStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // Preference is a convenience; failing to persist it is not fatal.
    }
  }, []);

  const stop = useCallback(() => Speech.stop(), []);

  return useMemo(
    () => ({
      /** True only when prompts will actually be spoken. */
      active,
      /** The stored preference, regardless of ui mode. */
      enabled,
      available: isElder,
      setPromptsEnabled,
      speak,
      speakKey,
      announceScreen,
      stop,
    }),
    [active, enabled, isElder, setPromptsEnabled, speak, speakKey, announceScreen, stop],
  );
}
