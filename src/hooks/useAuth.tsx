import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import Cookies from 'js-cookie';

// ─── Session helpers (kept for cross-domain usage) ──────────────────────────

function setSharedCookie(key: string, value: string) {
  const hostname = window.location.hostname;
  const cookieOptions: Cookies.CookieAttributes = {
    expires: 365,
    path: '/',
    secure: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
    sameSite: 'None', // Critical for cross-subdomain in strict browsers (Safari/Brave)
  };

  if (hostname.endsWith('fastestcrm.com')) {
    cookieOptions.domain = '.fastestcrm.com';
  }

  Cookies.set(key, value, cookieOptions);
}

function removeSharedCookie(key: string) {
  const hostname = window.location.hostname;
  Cookies.remove(key, { path: '/' });
  if (hostname.endsWith('fastestcrm.com')) {
    Cookies.remove(key, { path: '/', domain: '.fastestcrm.com' });
  }
}

// Removed custom device and token tracking functions in favor of standard Supabase auth

// ─── Context type ─────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Auth state subscription ───────────────────────────────────────────────

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth
      .getSession()
      .then(({ data: { session: existingSession } }) => {
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[Auth] getSession failed:', err);
        setLoading(false);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ── Public auth actions ───────────────────────────────────────────────────

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
