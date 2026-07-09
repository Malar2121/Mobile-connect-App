import { useMemo } from 'react';
import { useI18n } from '../i18n';

const TAB_ROUTES = [
  { route: 'Dashboard', key: 'tabs.dashboard', icon: 'home', iconOutline: 'home-outline' },
  { route: 'Events', key: 'tabs.events', icon: 'calendar', iconOutline: 'calendar-outline' },
  { route: 'Memories', key: 'tabs.memories', icon: 'images', iconOutline: 'images-outline' },
  { route: 'Chat', key: 'tabs.chat', icon: 'chatbubbles', iconOutline: 'chatbubbles-outline' },
  { route: 'Map', key: 'tabs.map', icon: 'map', iconOutline: 'map-outline' },
  { route: 'Profile', key: 'tabs.profile', icon: 'person', iconOutline: 'person-outline' },
];

/** Tab bar config with labels from the active locale. */
export function useTabConfig() {
  const { t } = useI18n();
  return useMemo(
    () =>
      TAB_ROUTES.map((item) => ({
        ...item,
        label: t(item.key),
      })),
    [t],
  );
}
