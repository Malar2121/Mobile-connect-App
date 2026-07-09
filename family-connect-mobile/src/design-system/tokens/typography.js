/**
 * Typography scale — Inter font family, Apple Health / Google Calendar clarity.
 */

export const fontFamilies = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

/** Base sizes before uiMode fontScale is applied */
export const typeScale = {
  display: { size: 34, lineHeight: 40, weight: 'bold', family: fontFamilies.bold },
  headline: { size: 28, lineHeight: 34, weight: 'bold', family: fontFamilies.bold },
  title1: { size: 22, lineHeight: 28, weight: '600', family: fontFamilies.semiBold },
  title2: { size: 18, lineHeight: 24, weight: '600', family: fontFamilies.semiBold },
  title3: { size: 16, lineHeight: 22, weight: '600', family: fontFamilies.semiBold },
  body: { size: 16, lineHeight: 24, weight: '400', family: fontFamilies.regular },
  bodySmall: { size: 14, lineHeight: 20, weight: '400', family: fontFamilies.regular },
  caption: { size: 12, lineHeight: 16, weight: '500', family: fontFamilies.medium },
  label: { size: 13, lineHeight: 18, weight: '600', family: fontFamilies.semiBold },
  overline: { size: 11, lineHeight: 14, weight: '600', family: fontFamilies.semiBold, letterSpacing: 0.8 },
};

export const chatTypography = {
  fontFamily: fontFamilies.medium,
  fontFamilyBold: fontFamilies.bold,
  fontFamilySemi: fontFamilies.semiBold,
  fontFamilyRegular: fontFamilies.regular,
};

export const dashboardTypography = {
  fontRegular: fontFamilies.regular,
  fontMedium: fontFamilies.medium,
  fontSemi: fontFamilies.semiBold,
  fontBold: fontFamilies.bold,
};

/**
 * @param {keyof typeof typeScale} variant
 * @param {number} fontScale
 * @param {object} colors
 */
export function textStyle(variant, fontScale = 1, colors = {}) {
  const t = typeScale[variant];
  return {
    fontFamily: t.family,
    fontSize: t.size * fontScale,
    lineHeight: t.lineHeight * fontScale,
    color: colors.text,
    ...(t.letterSpacing != null ? { letterSpacing: t.letterSpacing } : {}),
  };
}
