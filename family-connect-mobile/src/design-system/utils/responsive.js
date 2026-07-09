import { useWindowDimensions } from 'react-native';

export const BREAKPOINTS = {
  phone: 0,
  tablet: 600,
  desktop: 900,
};

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= BREAKPOINTS.tablet;
  const isLargeTablet = width >= BREAKPOINTS.desktop;
  const columns = isLargeTablet ? 3 : isTablet ? 2 : 1;
  const contentMaxWidth = isTablet ? Math.min(width - 48, 720) : width;
  const horizontalPadding = isTablet ? 32 : 20;
  const gridGap = isTablet ? 16 : 12;

  return {
    width,
    height,
    isTablet,
    isLargeTablet,
    columns,
    contentMaxWidth,
    horizontalPadding,
    gridGap,
  };
}

/**
 * Scale a value for tablet layouts.
 */
export function scaledSize(base, isTablet, factor = 1.15) {
  return isTablet ? Math.round(base * factor) : base;
}
