import { useUIMode } from '../contexts/UIModeContext';

/** Motion helpers respecting system reduced-motion preference. */
export function useMotion() {
  const { reduceMotion } = useUIMode();
  return {
    reduceMotion,
    /** Returns 0 when motion should be reduced, otherwise the requested duration. */
    duration: (ms) => (reduceMotion ? 0 : ms),
    /** Skip press scale transform when reduced motion is on. */
    pressTransform: reduceMotion ? [] : [{ scale: 0.98 }],
  };
}
