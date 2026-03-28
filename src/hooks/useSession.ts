import { useState, useCallback } from 'react';
import { SEED_USERS } from '../lib/constants';

const SESSION_KEY = 'choreTracker_session';

function getInitialId(): string {
  return sessionStorage.getItem(SESSION_KEY) || SEED_USERS[0].id;
}

// Returns the currently-selected user ID and a switcher.
// The caller is responsible for resolving the ID against live state.users.
export function useSession() {
  const [currentUserId, setCurrentUserId] = useState<string>(getInitialId);

  const switchUser = useCallback((userId: string) => {
    sessionStorage.setItem(SESSION_KEY, userId);
    setCurrentUserId(userId);
  }, []);

  return { currentUserId, switchUser };
}
