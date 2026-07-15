import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

  const authRef = useRef(isAuthenticated);
  useEffect(() => {
    authRef.current = isAuthenticated;
  }, [isAuthenticated]);

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
    if (!authRef.current) {
      applyFamilyData(null);
      return null;
    }

    setLoading(true);
    // Mock family data for screenshots
    const mockData = {
      family: { _id: 'mock_family', name: 'The Malaravans', inviteCode: 'MLRV2026' },
      members: [
        { _id: 'u1', fullName: 'Malaravan T.', role: 'admin', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80' },
        { _id: 'u2', fullName: 'Amma', role: 'member', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80' },
        { _id: 'u3', fullName: 'Appa', role: 'member', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
        { _id: 'u4', fullName: 'Sister', role: 'member', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80' }
      ]
    };
    applyFamilyData(mockData);
    setLoading(false);
    return mockData;
  }, [applyFamilyData]);

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
      const { family: joined } = await familyService.joinFamily(inviteCode);
      await refreshUserProfile();
      applyFamilyData({
        family: joined,
        memberCount: joined.members?.length ?? 0,
      });
      return joined;
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
  }, [isAuthenticated]);

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
