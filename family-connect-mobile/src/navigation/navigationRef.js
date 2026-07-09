import { createNavigationContainerRef } from '@react-navigation/native';
import { getNavigationTarget } from '../utils/notificationHelpers';

export const navigationRef = createNavigationContainerRef();

export function navigateFromNotification(notification) {
  if (!navigationRef.isReady()) return false;

  const target = getNavigationTarget(notification);

  if (target.screen && target.params) {
    navigationRef.navigate(target.tab, {
      screen: target.screen,
      params: target.params,
    });
  } else if (target.screen) {
    navigationRef.navigate(target.tab, { screen: target.screen });
  } else {
    navigationRef.navigate(target.tab);
  }

  return true;
}
