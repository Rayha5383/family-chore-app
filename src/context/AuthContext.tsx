import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  name: string;
  role: 'parent' | 'child';
  avatar_emoji: string;
  avatar_color: string;
  monthly_cap: number;
  parent_id?: string;
  login_email?: string;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  needsPasswordSet: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, profile: null, session: null, loading: true, needsPasswordSet: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsPasswordSet, setNeedsPasswordSet] = useState(false);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile(data as Profile);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);

      // Password reset link clicked
      if (event === 'PASSWORD_RECOVERY') {
        setNeedsPasswordSet(true);
      }
      // Invite link clicked — SIGNED_IN fires on first login via invite link
      if (event === 'SIGNED_IN') {
        const hash = window.location.hash;
        const search = window.location.search;
        if (hash.includes('type=invite') || search.includes('type=invite')) {
          setNeedsPasswordSet(true);
        }
      }
      // Password was successfully updated — clear the flag and proceed
      if (event === 'USER_UPDATED') {
        setNeedsPasswordSet(false);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, needsPasswordSet, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
