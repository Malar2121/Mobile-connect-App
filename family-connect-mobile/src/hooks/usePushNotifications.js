import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  registerPushTokenWithBackend,
  savePushTokenLocally,
} from '../services/notificationService';
import { navigateFromNotification } from '../navigation/navigationRef';
import { extractNotificationData } from '../utils/notificationHelpers';

/** Remote push was removed from Expo Go on Android (SDK 53+). */
export const isPushAvailable = !(
  Platform.OS === 'android' && Constants.appOwnership === 'expo'
);

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
 * Register push tokens and wire notification handlers (skipped in Android Expo Go).
 */
export function usePushNotifications(enabled) {
  const registered = useRef(false);

  useEffect(() => {
    if (!enabled || !isPushAvailable) return undefined;

    let cancelled = false;
    let responseSub;

    (async () => {
      const Notifications = await import('expo-notifications');

      if (cancelled) return;

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('family_connect_main', {
          name: 'Family Connect',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366F1',
          sound: 'default',
        });
      }

      const { status: existing } = await Notifications.getPermissionsAsync();
      let granted = existing === 'granted';
      if (!granted) {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: true, allowSound: true },
        });
        granted = status === 'granted';
      }

      if (granted && !registered.current) {
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        let primary = null;

        try {
          if (projectId) {
            const expo = await Notifications.getExpoPushTokenAsync({ projectId });
            primary = expo.data;
          }
        } catch {
          /* optional */
        }

        try {
          const device = await Notifications.getDevicePushTokenAsync();
          primary = primary || device.data;
        } catch {
          /* optional */
        }

        if (primary) {
          await savePushTokenLocally(primary);
          await registerPushTokenWithBackend(primary);
        }
        registered.current = true;
      }

      const last = await Notifications.getLastNotificationResponseAsync();
      if (last) handleNotificationNavigation(last);

      responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationNavigation(response);
      });
    })().catch(() => {
      /* Push is optional in development */
    });

    return () => {
      cancelled = true;
      responseSub?.remove();
    };
  }, [enabled]);
}
