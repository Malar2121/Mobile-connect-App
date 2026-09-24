import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import {
  registerPushTokenWithBackend,
  savePushTokenLocally,
} from '../services/notificationService';
import { navigateFromNotification } from '../navigation/navigationRef';
import { extractNotificationData } from '../utils/notificationHelpers';

/**
 * Returns true only when push notifications are actually supported.
 * Remote push was removed from Expo Go on Android (SDK 53+).
 * This must be checked BEFORE importing expo-notifications to avoid
 * DevicePushTokenAutoRegistration.fx.js running addPushTokenListener at
 * module load time and crashing with [runtime not ready].
 */
function canUsePush() {
  // iOS Expo Go still supports local notifications — only block Android Expo Go
  if (Platform.OS === 'android') {
    try {
      if (isRunningInExpoGo()) return false;
    } catch {
      return false;
    }
  }
  return true;
}

function handleNotificationNavigation(response) {
  const payload = extractNotificationData(response);
  AsyncStorage.getItem('fc_ui_mode').then((uiMode) => {
    if (uiMode === 'minor' && payload.type === 'chat_message') {
      navigateFromNotification({ type: 'default' });
      return;
    }
    navigateFromNotification(payload);
  });
}

/**
 * Register push tokens and wire notification handlers.
 * Completely skipped in Android Expo Go — expo-notifications is NOT imported
 * at all in that case to avoid the module-level addPushTokenListener crash.
 */
export function usePushNotifications(enabled) {
  const registered = useRef(false);

  useEffect(() => {
    // Bail out entirely before any import of expo-notifications
    if (!enabled || !canUsePush()) return undefined;

    let cancelled = false;
    let responseSub;
    let receivedSub;

    (async () => {
      try {
        // Dynamic import so expo-notifications (and its DevicePushTokenAutoRegistration.fx.js)
        // never loads at all when canUsePush() returns false above.
        const Notifications = await import('expo-notifications');
        if (cancelled) return;

        // Set handler (safe no-op if unsupported)
        try {
          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: true,
              shouldShowBanner: true,
              shouldShowList: true,
            }),
          });
        } catch { /* ignore */ }

        // Create notification channel on Android development/standalone builds
        if (Platform.OS === 'android') {
          try {
            await Notifications.setNotificationChannelAsync('family_connect_main', {
              name: 'Family Connect',
              importance: Notifications.AndroidImportance.HIGH,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#6366F1',
              sound: 'default',
            });
          } catch { /* ignore */ }
        }

        // Request permissions
        let granted = false;
        try {
          const { status: existing } = await Notifications.getPermissionsAsync();
          granted = existing === 'granted';
          if (!granted) {
            const { status } = await Notifications.requestPermissionsAsync({
              ios: { allowAlert: true, allowBadge: true, allowSound: true },
            });
            granted = status === 'granted';
          }
        } catch { /* ignore */ }

        // Register device/expo push token with backend
        if (granted && !registered.current) {
          const projectId =
            Constants.expoConfig?.extra?.eas?.projectId ??
            Constants.easConfig?.projectId;

          let primary = null;

          try {
            if (projectId) {
              const expo = await Notifications.getExpoPushTokenAsync({ projectId });
              primary = expo.data;
            }
          } catch { /* ignore */ }

          try {
            const device = await Notifications.getDevicePushTokenAsync();
            primary = primary || device.data;
          } catch { /* ignore */ }

          if (primary) {
            await savePushTokenLocally(primary).catch(() => {});
            await registerPushTokenWithBackend(primary).catch(() => {});
          }
          registered.current = true;
        }

        // Handle notification that launched the app
        try {
          const last = await Notifications.getLastNotificationResponseAsync();
          if (last) handleNotificationNavigation(last);
        } catch { /* ignore */ }

        // Listen for user tapping on notifications
        responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
          handleNotificationNavigation(response);
        });

        // Listen for foreground notifications
        receivedSub = Notifications.addNotificationReceivedListener(() => {
          // can extend: e.g. refresh notification badge count
        });
      } catch (e) {
        console.warn('[usePushNotifications] Init skipped:', e?.message || e);
      }
    })();

    return () => {
      cancelled = true;
      responseSub?.remove();
      receivedSub?.remove();
    };
  }, [enabled]);
}

/** Export for consumers that want to check availability (e.g. UI toggles) */
export const isPushAvailable = canUsePush;
