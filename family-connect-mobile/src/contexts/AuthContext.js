import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, bindSessionExpiredCallback, setAuthToken } from '../services/api';
import * as authService from '../services/authService';
import { disconnectSocket } from '../socket/socketClient';

const AuthContext = createContext(undefined);

const TOKEN_KEY = 'fc_auth_token';
const REFRESH_TOKEN_KEY = 'fc_refresh_token';

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
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      /* key may be missing */
    }
  }, []);

  // If a silent token refresh ever fails (refresh token expired/invalid),
  // the api layer calls this so the user is dropped back to the login screen
  // instead of being stuck on a broken authenticated screen.
  useEffect(() => {
    bindSessionExpiredCallback(() => {
      clearSession();
    });
  }, [clearSession]);

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

  const establishSession = useCallback(async ({ accessToken, refreshToken, user: profile }) => {
    if (!accessToken) {
      throw new Error('Login response did not include an access token');
    }
    setAuthToken(accessToken);
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    if (refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    }
    setTokenState(accessToken);
    setUser(profile);
  }, []);

  const signIn = useCallback(async (email, password) => {
    const result = await authService.loginUser(email, password);
    // 2FA-enabled accounts must complete a TOTP challenge before tokens issue
    if (result.requires2FA) {
      return { requires2FA: true, tempToken: result.tempToken };
    }
    await establishSession(result);
    return { requires2FA: false };
  }, [establishSession]);

  const completeTwoFactorSignIn = useCallback(async (tempToken, code) => {
    const result = await authService.loginWith2FA(tempToken, code);
    await establishSession(result);
  }, [establishSession]);

  const signUp = useCallback(async (name, email, password, memberType = 'adult') => {
    await authService.registerUser(name, email, password, memberType);
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
      completeTwoFactorSignIn,
      signUp,
      signOut,
      setUser,
    }),
    [token, user, hydrated, signIn, completeTwoFactorSignIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
