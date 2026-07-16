import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { API_ORIGIN, bindNetworkStatusCallback } from '../services/api';
import { flushOfflineQueue } from '../utils/offlineQueue';
import { registerOfflineProcessors } from '../utils/offlineProcessors';

const NetworkContext = createContext({
  isOnline: true,
  refreshConnectivity: async () => true,
});

async function pingHealth() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${API_ORIGIN}/health`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);

  const refreshConnectivity = useCallback(async () => {
    const ok = await pingHealth();
    setIsOnline(ok);
    if (ok) await flushOfflineQueue().catch(() => {});
    return ok;
  }, []);

  useEffect(() => {
    const unregister = registerOfflineProcessors();
    bindNetworkStatusCallback(setIsOnline);
    refreshConnectivity();
    const interval = setInterval(refreshConnectivity, 60_000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshConnectivity();
    });
    return () => {
      unregister();
      bindNetworkStatusCallback(null);
      clearInterval(interval);
      sub.remove();
    };
  }, [refreshConnectivity]);

  const value = useMemo(() => ({ isOnline, refreshConnectivity }), [isOnline, refreshConnectivity]);

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork() {
  return useContext(NetworkContext);
}
