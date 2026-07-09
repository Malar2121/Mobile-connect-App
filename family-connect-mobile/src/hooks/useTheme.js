import { useUIMode } from '../contexts/UIModeContext';

/**
 * Resolved palette + layout for the current UI mode and light/dark theme.
 */
export function useTheme() {
  return useUIMode();
}
