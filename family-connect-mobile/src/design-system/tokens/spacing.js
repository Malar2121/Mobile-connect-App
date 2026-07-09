/**
 * 4pt base spacing grid — consistent across all screens.
 */

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 56,
  '7xl': 64,
};

/** Legacy 8pt aliases */
export const legacySpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const dashboardSpacing = {
  unit: 8,
  xs: spacing.sm,
  sm: spacing.lg,
  md: spacing['2xl'],
  lg: spacing['3xl'],
  xl: spacing['4xl'],
  screen: spacing.xl,
};

/**
 * UI density presets — Standard / Minor / Elder accessibility modes.
 */
export const uiModeLayout = {
  standard: {
    fontScale: 1,
    minTouch: 44,
    sectionGap: spacing.lg,
    contentPadding: spacing.xl,
    iconSize: 22,
    avatarSize: 44,
  },
  minor: {
    fontScale: 1.06,
    minTouch: 48,
    sectionGap: spacing['2xl'],
    contentPadding: spacing['2xl'],
    iconSize: 24,
    avatarSize: 48,
  },
  elder: {
    fontScale: 1.24,
    minTouch: 60,
    sectionGap: spacing['4xl'],
    contentPadding: spacing['3xl'],
    iconSize: 30,
    avatarSize: 64,
    buttonScale: 1.12,
    simplifiedLayout: true,
  },
};
