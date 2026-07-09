import { createContext, useContext } from 'react';

const MapModuleContext = createContext(null);

export function MapModuleProvider({ value, children }) {
  return <MapModuleContext.Provider value={value}>{children}</MapModuleContext.Provider>;
}

export function useMapModule() {
  const ctx = useContext(MapModuleContext);
  if (!ctx) throw new Error('useMapModule must be used within MapModuleProvider');
  return ctx;
}
