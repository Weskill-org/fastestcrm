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

// ─── Session-token helpers ────────────────────────────────────────────────────

const SESSION_TOKEN_KEY = 'app_session_token';

function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function getOrCreateSessionToken(): string {
  let token = localStorage.getItem(SESSION_TOKEN_KEY);
  if (!token) {
    token = generateSessionToken();
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  }
  return token;
}

function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  const isMobile = /Mobile|Android|iPhone|iPad/.test(ua);
  const browser = ua.includes('Chrome')
    ? 'Chrome'
    : ua.includes('Firefox')
      ? 'Firefox'
      : ua.includes('Safari')
        ? 'Safari'
        : ua.includes('Edge')
          ? 'Edge'
          : 'Browser';
  const os = ua.includes('Windows')
    ? 'Windows'
    : ua.includes('Mac')
      ? 'macOS'
      : ua.includes('Linux')
        ? 'Linux'
        : ua.includes('Android')
          ? 'Android'
          : ua.includes('iPhone') || ua.includes('iPad')
            ? 'iOS'
            : 'Unknown';
  return `${browser} on ${os}${isMobile ? ' (Mobile)' : ''}`;
}

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

  const sessionRegistered = useRef(false);
  const validationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isValidatingSession = useRef(false);
  const { toast } = useToast();

  // ── Session management RPCs (fire-and-forget, never block auth) ─────────────

  const registerSession = useCallback(async (userId: string) => {
    if (sessionRegistered.current) return;
    try {
      const { error } = await supabase.rpc('register_user_session', {
        p_user_id: userId,
        p_session_token: getOrCreateSessionToken(),
        p_device_info: getDeviceInfo(),
      });
      if (!error) sessionRegistered.current = true;
      else console.warn('[Auth] Session registration failed:', error.message);
    } catch (err) {
      console.warn('[Auth] Session registration error:', err);
    }
  }, []);

  const validateSession = useCallback(async (userId: string): Promise<boolean> => {
    if (isValidatingSession.current) return true;
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!sessionToken) return true;

    isValidatingSession.current = true;
    try {
      const { data, error } = await supabase.rpc('validate_user_session', {
        p_user_id: userId,
        p_session_token: sessionToken,
      });
      isValidatingSession.current = false;
      if (error) {
        console.warn('[Auth] Session validation error:', error.message);
        return true;
      }
      return data === true;
    } catch (err) {
      isValidatingSession.current = false;
      console.warn('[Auth] Session validation failed:', err);
      return true;
    }
  }, []);

  const removeSession = useCallback(async (userId: string) => {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!sessionToken || !userId) return;
    try {
      await supabase.rpc('remove_user_session', {
        p_user_id: userId,
        p_session_token: sessionToken,
      });
      sessionRegistered.current = false;
    } catch (err) {
      console.warn('[Auth] Failed to remove session:', err);
    }
  }, []);

  const forceLogout = useCallback(async () => {
    if (validationInterval.current) {
      clearInterval(validationInterval.current);
      validationInterval.current = null;
    }
    toast({
      title: 'Session Expired',
      description: 'You were logged out because you signed in on another device.',
      variant: 'destructive',
    });
    localStorage.removeItem(SESSION_TOKEN_KEY);
    sessionRegistered.current = false;
    await supabase.auth.signOut();
  }, [toast]);

  // ── Auth state subscription ───────────────────────────────────────────────

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && newSession?.user) {
          setTimeout(() => registerSession(newSession.user.id), 0);
        } else if (event === 'SIGNED_OUT') {
          sessionRegistered.current = false;
          if (validationInterval.current) {
            clearInterval(validationInterval.current);
            validationInterval.current = null;
          }
        }
      }
    );

    supabase.auth
      .getSession()
      .then(({ data: { session: existingSession } }) => {
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        setLoading(false);

        if (existingSession?.user) {
          setTimeout(() => registerSession(existingSession.user.id), 0);
        }
      })
      .catch((err) => {
        console.error('[Auth] getSession failed:', err);
        setLoading(false);
      });

    return () => {
      subscription.unsubscribe();
      if (validationInterval.current) clearInterval(validationInterval.current);
    };
  }, [registerSession]);

  // ── Periodic session validation ───────────────────────────────────────────

  useEffect(() => {
    if (user && sessionRegistered.current) {
      const startDelay = setTimeout(() => {
        validationInterval.current = setInterval(async () => {
          const isValid = await validateSession(user.id);
          if (!isValid) await forceLogout();
        }, 60_000); // every 60 s
      }, 5_000); // wait 5 s after login before starting

      return () => {
        clearTimeout(startDelay);
        if (validationInterval.current) clearInterval(validationInterval.current);
      };
    }
  }, [user, validateSession, forceLogout]);

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
    if (user) await removeSession(user.id);
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
