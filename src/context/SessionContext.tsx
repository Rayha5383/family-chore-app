import { createContext, useContext } from 'react';
import type { User } from '../types';

interface SessionContextType {
  currentUser: User;
  switchUser: (userId: string) => void;
}

export const SessionContext = createContext<SessionContextType | null>(null);

export function useSessionContext() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('Must be inside SessionContext.Provider');
  return ctx;
}
