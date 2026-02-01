import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SESSION_TOKEN_KEY = 'app_session_token';

// Generate a unique session token for this browser/device
const generateSessionToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Get or create session token for this device
const getOrCreateSessionToken = (): string => {
  let token = localStorage.getItem(SESSION_TOKEN_KEY);
  if (!token) {
    token = generateSessionToken();
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  }
  return token;
};

// Get device info for display purposes
const getDeviceInfo = (): string => {
  const ua = navigator.userAgent;
  const isMobile = /Mobile|Android|iPhone|iPad/.test(ua);
  const browser = ua.includes('Chrome') ? 'Chrome' : 
                  ua.includes('Firefox') ? 'Firefox' : 
                  ua.includes('Safari') ? 'Safari' : 
                  ua.includes('Edge') ? 'Edge' : 'Browser';
  const os = ua.includes('Windows') ? 'Windows' :
             ua.includes('Mac') ? 'macOS' :
             ua.includes('Linux') ? 'Linux' :
             ua.includes('Android') ? 'Android' :
             ua.includes('iPhone') || ua.includes('iPad') ? 'iOS' : 'Unknown';
  
  return `${browser} on ${os}${isMobile ? ' (Mobile)' : ''}`;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRegistered = useRef(false);
  const validationInterval = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Register session in database
  const registerSession = useCallback(async (userId: string) => {
    if (sessionRegistered.current) return;

    const sessionToken = getOrCreateSessionToken();
    const deviceInfo = getDeviceInfo();

    try {
      // Upsert session (update if exists, insert if not)
      const { error } = await supabase
        .from('user_sessions')
        .upsert(
          {
            user_id: userId,
            session_token: sessionToken,
            device_info: deviceInfo,
            last_active: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,session_token',
          }
        );

      if (error) {
        console.error('Error registering session:', error);
        return;
      }

      sessionRegistered.current = true;
    } catch (err) {
      console.error('Failed to register session:', err);
    }
  }, []);

  // Validate if current session is still valid
  const validateSession = useCallback(async (userId: string): Promise<boolean> => {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    
    if (!sessionToken) {
      return false;
    }

    try {
      // Check if our session exists
      const { data, error } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('session_token', sessionToken)
        .single();

      if (error || !data) {
        // Session doesn't exist - was invalidated
        return false;
      }

      // Update last_active timestamp
      await supabase
        .from('user_sessions')
        .update({ last_active: new Date().toISOString() })
        .eq('id', data.id);

      return true;
    } catch (err) {
      console.error('Session validation failed:', err);
      return false;
    }
  }, []);

  // Remove session on logout
  const removeSession = useCallback(async (userId: string) => {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    
    if (!sessionToken || !userId) return;

    try {
      await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId)
        .eq('session_token', sessionToken);

      sessionRegistered.current = false;
    } catch (err) {
      console.error('Failed to remove session:', err);
    }
  }, []);

  // Force logout when session is invalidated
  const forceLogout = useCallback(async () => {
    toast({
      title: 'Session Expired',
      description: 'You have been logged out because you logged in on another device. Maximum 2 devices allowed.',
      variant: 'destructive',
    });
    
    localStorage.removeItem(SESSION_TOKEN_KEY);
    sessionRegistered.current = false;
    
    await supabase.auth.signOut();
  }, [toast]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && newSession?.user) {
          // Register session on login
          await registerSession(newSession.user.id);
        } else if (event === 'SIGNED_OUT') {
          // Clear session tracking
          sessionRegistered.current = false;
          if (validationInterval.current) {
            clearInterval(validationInterval.current);
            validationInterval.current = null;
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);

      if (existingSession?.user) {
        // Register/validate session for existing login
        await registerSession(existingSession.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (validationInterval.current) {
        clearInterval(validationInterval.current);
      }
    };
  }, [registerSession]);

  // Periodically validate session (every 30 seconds)
  useEffect(() => {
    if (user && sessionRegistered.current) {
      validationInterval.current = setInterval(async () => {
        const isValid = await validateSession(user.id);
        if (!isValid) {
          await forceLogout();
        }
      }, 30000); // Check every 30 seconds

      return () => {
        if (validationInterval.current) {
          clearInterval(validationInterval.current);
        }
      };
    }
  }, [user, validateSession, forceLogout]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });
    return { error };
  };

  const signOut = async () => {
    if (user) {
      await removeSession(user.id);
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}