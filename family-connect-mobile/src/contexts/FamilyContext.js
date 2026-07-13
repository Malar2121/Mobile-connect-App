import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import * as authService from '../services/authService';
import * as familyService from '../services/familyService';

const FamilyContext = createContext(undefined);

function isNoFamilyError(error) {
  return error.status === 404 || /not part of any family/i.test(error.message || '');
}

export function FamilyProvider({ children }) {
  const { isAuthenticated, setUser } = useAuth();
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  const applyFamilyData = useCallback((data) => {
    if (data?.family) {
      setFamily(data.family);
      setMembers(data.family.members ?? []);
      return data;
    }
    setFamily(null);
    setMembers([]);
    return null;
  }, []);

  const fetchFamily = useCallback(async () => {
    if (!isAuthenticated) {
      applyFamilyData(null);
      return null;
    }

    setLoading(true);
    try {
      const data = await familyService.getMyFamily();
      return applyFamilyData(data);
    } catch (error) {
      if (isNoFamilyError(error)) {
        applyFamilyData(null);
        return null;
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, applyFamilyData]);

  const refreshFamily = useCallback(() => fetchFamily(), [fetchFamily]);

  const refreshUserProfile = useCallback(async () => {
    try {
      const profile = await authService.getCurrentUser();
      setUser(profile);
    } catch {
      /* profile refresh is best-effort */
    }
  }, [setUser]);

  const createFamily = useCallback(
    async (name) => {
      const { family: created } = await familyService.createFamily(name);
      await refreshUserProfile();
      applyFamilyData({
        family: created,
        memberCount: created.members?.length ?? 1,
      });
      return created;
    },
    [applyFamilyData, refreshUserProfile],
  );

  const joinFamily = useCallback(
    async (inviteCode) => {
      const result = await familyService.joinFamily(inviteCode);
      if (result.pending) {
        return result;
      }
      await refreshUserProfile();
      applyFamilyData({
        family: result.family,
        memberCount: result.family.members?.length ?? 0,
      });
      return result.family;
    },
    [applyFamilyData, refreshUserProfile],
  );

  useEffect(() => {
    if (isAuthenticated) {
      fetchFamily().catch(() => {
        /* errors surface when screens call refreshFamily */
      });
    } else {
      setFamily(null);
      setMembers([]);
      setLoading(false);
    }
  }, [isAuthenticated, fetchFamily]);

  const value = useMemo(
    () => ({
      family,
      members,
      loading,
      fetchFamily,
      createFamily,
      joinFamily,
      refreshFamily,
    }),
    [family, members, loading, fetchFamily, createFamily, joinFamily, refreshFamily],
  );

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

export function useFamily() {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error('useFamily must be used within FamilyProvider');
  return ctx;
}
