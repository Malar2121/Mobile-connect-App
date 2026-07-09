import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from './useTheme';
import { getAccessibilityPolicy } from '../utils/accessibilityPolicy';

export function useAccessibilityPolicy() {
  const { uiMode } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return useMemo(() => getAccessibilityPolicy(uiMode, { isAdmin }), [uiMode, isAdmin]);
}
