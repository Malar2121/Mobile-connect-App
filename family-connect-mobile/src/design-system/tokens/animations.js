/**
 * Reanimated spring / timing presets — consistent motion language.
 */

export const springPresets = {
  gentle: { damping: 20, stiffness: 180, mass: 0.8 },
  snappy: { damping: 16, stiffness: 220, mass: 0.7 },
  bouncy: { damping: 12, stiffness: 200, mass: 0.6 },
  stiff: { damping: 24, stiffness: 300, mass: 1 },
};

export const timingPresets = {
  fast: 180,
  normal: 280,
  slow: 420,
  entrance: 520,
};

export const fadeIn = {
  duration: timingPresets.normal,
};

export const staggerDelay = 60;
