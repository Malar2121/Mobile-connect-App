import { lightSemantic, darkSemantic, lightColors, darkColors, highContrastLightSemantic, highContrastDarkSemantic } from '../tokens/colors';
import { typeScale, fontFamilies } from '../tokens/typography';
import { spacing, uiModeLayout } from '../tokens/spacing';
import { radii } from '../tokens/radii';
import { createShadows } from '../tokens/shadows';
import { createGradients } from '../tokens/gradients';

/**
 * Resolves the full design-system theme for current scheme + UI mode.
 * @param {'light' | 'dark'} scheme
 * @param {'standard' | 'minor' | 'elder'} uiMode
 * @param {{ highContrast?: boolean }} [options]
 */
export function resolveTheme(scheme, uiMode = 'standard', options = {}) {
  const { highContrast = false } = options;
  const isDark = scheme === 'dark';
  let semantic = isDark ? darkSemantic : lightSemantic;
  if (highContrast) {
    semantic = isDark ? highContrastDarkSemantic : highContrastLightSemantic;
  }
  const colors = isDark ? darkColors : lightColors;
  const layout = uiModeLayout[uiMode] ?? uiModeLayout.standard;

  return {
    scheme,
    isDark,
    uiMode,
    highContrast,
    colors: { ...colors, ...semantic },
    semantic,
    layout,
    spacing,
    radii,
    shadows: createShadows(isDark),
    gradients: createGradients(isDark),
    typography: typeScale,
    fonts: fontFamilies,
    fontScale: layout.fontScale,
  };
}
