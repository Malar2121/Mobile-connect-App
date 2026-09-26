import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Modal, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { useI18n, getLocaleTag } from '../i18n';
import { connectSocket, subscribeSocketEvent } from '../socket/socketClient';
import { navigationRef } from '../navigation/navigationRef';

const SIREN = require('../../assets/sounds/sos-siren.wav');
const VIBRATION_PATTERN = [0, 800, 400, 800];
const ALARM_MAX_MS = 60000;
const SPEECH_REPEAT_GAP_MS = 1500;

// Expo Go on Android has no ExpoAudio native module, and requiring expo-audio there is a
// fatal error that try/catch cannot stop. Check for the module first (this never throws).
let audioModuleAvailable;
function hasAudioModule() {
  if (audioModuleAvailable === undefined) {
    audioModuleAvailable = requireOptionalNativeModule('ExpoAudio') != null;
  }
  return audioModuleAvailable;
}

/**
 * Full-screen alert when another family member sends an SOS while this app is open.
 * The push notification remains the fallback when the app is in the background.
 */
export function SosAlertOverlay() {
  const { token, user } = useAuth();
  const { layout } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const [alert, setAlert] = useState(null);
  const seenKeys = useRef(new Set());
  const playerRef = useRef(null);
  const speechTimer = useRef(null);
  const alarmRun = useRef(0); // bumps on every stop, so a late async start cannot restart the siren
  const pulse = useSharedValue(1);

  const userId = user?._id;
  const familyId = user?.familyId;

  useEffect(() => {
    if (!token || !familyId) return undefined;
    try {
      connectSocket(token);
    } catch {
      return undefined;
    }
    return subscribeSocketEvent('sos_alert', (payload) => {
      if (!payload?.userId || String(payload.userId) === String(userId)) return; // no pop-up for the sender
      const key = `${payload.userId}|${payload.createdAt}`;
      if (seenKeys.current.has(key)) return;
      seenKeys.current.add(key);
      setAlert(payload); // a newer alert replaces the one on screen
    });
  }, [token, familyId, userId]);

  const name = alert?.fullName || t('tree.familyMember');
  const message = alert?.message || t('map.sosAlertDefaultMessage', { name });
  const spoken = alert ? t('map.sosAlertSpoken', { name, message }) : '';

  const stopAlarm = useCallback(() => {
    alarmRun.current += 1;
    Vibration.cancel();
    try {
      playerRef.current?.pause();
    } catch {
      /* player already released */
    }
    clearTimeout(speechTimer.current);
    speechTimer.current = null;
    Speech.stop();
  }, []);

  const startAlarm = useCallback(async (fallbackText) => {
    alarmRun.current += 1;
    const run = alarmRun.current;
    Vibration.vibrate(VIBRATION_PATTERN, true);

    if (!hasAudioModule()) {
      // No siren available: repeat the spoken alert like an alarm until stopAlarm() runs.
      const speakAgain = () => {
        if (run !== alarmRun.current) return;
        try {
          Speech.speak(fallbackText, {
            language: getLocaleTag(),
            onDone: () => {
              if (run !== alarmRun.current) return;
              speechTimer.current = setTimeout(speakAgain, SPEECH_REPEAT_GAP_MS);
            },
          });
        } catch {
          /* speech is best effort */
        }
      };
      speakAgain();
      return;
    }

    try {
      // Loaded lazily so a missing native module cannot crash the app.
      const { createAudioPlayer, setAudioModeAsync } = require('expo-audio');
      await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' });
      if (run !== alarmRun.current) return; // stopped while the audio mode was being set
      if (!playerRef.current) playerRef.current = createAudioPlayer(SIREN);
      const player = playerRef.current;
      player.loop = true;
      player.volume = 1;
      await player.seekTo(0);
      if (run !== alarmRun.current) return;
      player.play();
    } catch {
      if (run === alarmRun.current) {
        try {
          Speech.speak(fallbackText, { language: getLocaleTag() });
        } catch {
          /* speech is best effort */
        }
      }
    }
  }, []);

  // Siren, vibration and pulse while an alert is on screen; auto-stop after 60 s.
  useEffect(() => {
    if (!alert) return undefined;
    startAlarm(spoken);
    AccessibilityInfo.announceForAccessibility(spoken);
    pulse.value = withRepeat(withSequence(withTiming(1.18, { duration: 500 }), withTiming(1, { duration: 500 })), -1);
    const timer = setTimeout(stopAlarm, ALARM_MAX_MS);
    return () => {
      clearTimeout(timer);
      stopAlarm();
      cancelAnimation(pulse);
      pulse.value = 1;
    };
  }, [alert, spoken, startAlarm, stopAlarm, pulse]);

  // Going to the background silences the alarm; the pop-up stays for when they return.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') stopAlarm();
    });
    return () => sub.remove();
  }, [stopAlarm]);

  useEffect(
    () => () => {
      stopAlarm();
      try {
        playerRef.current?.remove();
      } catch {
        /* already released */
      }
      playerRef.current = null;
    },
    [stopAlarm],
  );

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const dismiss = useCallback(() => {
    stopAlarm();
    setAlert(null);
  }, [stopAlarm]);

  const viewLocation = useCallback(() => {
    if (!alert) return;
    const params = {
      userId: String(alert.userId),
      // The emergency position sent with the SOS, shown even if the family map has not loaded it.
      sosLatitude: alert.latitude,
      sosLongitude: alert.longitude,
      sosName: alert.fullName,
      sosAt: alert.createdAt,
    };
    dismiss();
    if (navigationRef.isReady()) {
      navigationRef.navigate('Map', { screen: 'MemberLocationDetails', params });
    }
  }, [alert, dismiss]);

  if (!alert) return null;

  const fs = layout.fontScale;
  const time = new Date(alert.createdAt ?? Date.now()).toLocaleTimeString(getLocaleTag(), {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={dismiss}>
      <LinearGradient
        colors={['#DC2626', '#991B1B', '#450A0A']}
        style={[styles.fill, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}
      >
        <View style={styles.body} accessible accessibilityRole="alert" accessibilityLabel={spoken}>
          <Animated.View style={[styles.iconRing, pulseStyle]}>
            <Ionicons name="warning" size={88 * fs} color="#FFFFFF" />
          </Animated.View>
          <Text style={[styles.title, { fontSize: 32 * fs, lineHeight: 40 * fs }]}>
            {t('map.sosAlertTitle', { name })}
          </Text>
          <Text style={[styles.message, { fontSize: 20 * fs, lineHeight: 28 * fs }]}>{message}</Text>
          <Text style={[styles.time, { fontSize: 16 * fs }]}>{t('map.sosAlertTime', { time })}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={viewLocation}
            style={({ pressed }) => [styles.primaryBtn, { minHeight: layout.minTouch + 16, opacity: pressed ? 0.85 : 1 }]}
            accessibilityRole="button"
          >
            <Ionicons name="location" size={24 * fs} color="#991B1B" />
            <Text style={[styles.primaryText, { fontSize: 19 * fs }]}>{t('map.sosAlertViewLocation')}</Text>
          </Pressable>
          <Pressable
            onPress={dismiss}
            style={({ pressed }) => [styles.secondaryBtn, { minHeight: layout.minTouch + 16, opacity: pressed ? 0.85 : 1 }]}
            accessibilityRole="button"
          >
            <Ionicons name="checkmark-circle" size={24 * fs} color="#FFFFFF" />
            <Text style={[styles.secondaryText, { fontSize: 19 * fs }]}>{t('map.sosAlertSeen')}</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconRing: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', textAlign: 'center' },
  message: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', textAlign: 'center', marginTop: 12 },
  time: { color: 'rgba(255,255,255,0.8)', fontFamily: 'Inter_400Regular', marginTop: 10 },
  actions: { gap: 12 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  primaryText: { color: '#991B1B', fontFamily: 'Inter_700Bold' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  secondaryText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold' },
});
