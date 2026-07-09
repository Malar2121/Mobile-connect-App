import { useAuth } from '../contexts/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';

/**
 * Registers push tokens and notification listeners when the user is signed in.
 */
export function NotificationRegistrar({ children }) {
  const { isAuthenticated, hydrated } = useAuth();
  usePushNotifications(isAuthenticated && hydrated);
  return children;
}
