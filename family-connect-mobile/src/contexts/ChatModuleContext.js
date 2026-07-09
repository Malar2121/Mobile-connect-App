import { createContext, useContext } from 'react';

const ChatModuleContext = createContext(null);

export function ChatModuleProvider({ value, children }) {
  return <ChatModuleContext.Provider value={value}>{children}</ChatModuleContext.Provider>;
}

export function useChatModule() {
  const ctx = useContext(ChatModuleContext);
  if (!ctx) throw new Error('useChatModule must be used within ChatModuleProvider');
  return ctx;
}
