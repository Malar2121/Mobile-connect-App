import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, setAuthToken } from '../services/api';
import * as authService from '../services/authService';
import { disconnectSocket } from '../socket/socketClient';

const AuthContext = createContext(undefined);

const TOKEN_KEY = 'fc_auth_token';

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  const clearSession = useCallback(async () => {
    setTokenState(null);
    setUser(null);
    setAuthToken(null);
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
      /* key may be missing */
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        if (cancelled) return;

        if (stored) {
          setAuthToken(stored);
          setTokenState(stored);
          try {
            const profile = await authService.getCurrentUser();
            if (!cancelled) setUser(profile);
          } catch {
            if (!cancelled) await clearSession();
          }
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const signIn = useCallback(async (email, password) => {
    const { accessToken, user: nextUser } = await authService.loginUser(
      email,
      password,
    );
    setAuthToken(accessToken);
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    setTokenState(accessToken);
    setUser(nextUser);
  }, []);

  const signUp = useCallback(async (name, email, password) => {
    await authService.registerUser(name, email, password);
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch {
      /* still clear locally */
    }
    disconnectSocket();
    await clearSession();
  }, [token, clearSession]);

  const value = useMemo(
    () => ({
      token,
      user,
      hydrated,
      isAuthenticated: Boolean(token),
      signIn,
      signUp,
      signOut,
      setUser,
    }),
    [token, user, hydrated, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
