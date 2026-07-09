/**
 * Elevation system — subtle depth like Apple Health / Airbnb.
 */

export function createShadows(isDark) {
  const shadowColor = isDark ? '#000000' : '#0D0D12';
  return {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    xs: {
      shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    sm: {
      shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.35 : 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    lg: {
      shadowColor: isDark ? '#4F56D9' : '#4F56D9',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.25 : 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
    fab: {
      shadowColor: '#4F56D9',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.4 : 0.28,
      shadowRadius: 16,
      elevation: 10,
    },
  };
}

export const dashboardShadows = {
  card: {
    shadowColor: '#4F56D9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  soft: {
    shadowColor: '#0D0D12',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  fab: {
    shadowColor: '#4F56D9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
};

export const chatShadows = {
  soft: dashboardShadows.card,
  card: dashboardShadows.soft,
  fab: dashboardShadows.fab,
};
