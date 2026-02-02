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
  const isValidatingSession = useRef(false);
  const { toast } = useToast();

  // Register session using RPC function - with retry logic
  const registerSession = useCallback(async (userId: string) => {
    if (sessionRegistered.current) return;

    const sessionToken = getOrCreateSessionToken();
    const deviceInfo = getDeviceInfo();

    try {
      const { error } = await supabase.rpc('register_user_session', {
        p_user_id: userId,
        p_session_token: sessionToken,
        p_device_info: deviceInfo,
      });

      if (error) {
        // Log but don't block - session management is secondary to core auth
        console.warn('[Auth] Session registration failed:', error.message);
        return;
      }

      sessionRegistered.current = true;
    } catch (err) {
      // Silent fail - don't disrupt user experience
      console.warn('[Auth] Session registration error:', err);
    }
  }, []);

  // Validate if current session is still valid using RPC
  const validateSession = useCallback(async (userId: string): Promise<boolean> => {
    // Prevent concurrent validation calls
    if (isValidatingSession.current) return true;
    
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    
    if (!sessionToken) {
      return true; // No token means fresh session, allow it
    }

    isValidatingSession.current = true;

    try {
      const { data, error } = await supabase.rpc('validate_user_session', {
        p_user_id: userId,
        p_session_token: sessionToken,
      });

      isValidatingSession.current = false;

      if (error) {
        // On error, be permissive - don't kick out user for DB issues
        console.warn('[Auth] Session validation error:', error.message);
        return true;
      }

      return data === true;
    } catch (err) {
      isValidatingSession.current = false;
      // On exception, be permissive
      console.warn('[Auth] Session validation failed:', err);
      return true;
    }
  }, []);

  // Remove session on logout using RPC
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
      // Silent fail - don't block logout
      console.warn('[Auth] Failed to remove session:', err);
    }
  }, []);

  // Force logout when session is invalidated
  const forceLogout = useCallback(async () => {
    // Clear interval first to prevent multiple calls
    if (validationInterval.current) {
      clearInterval(validationInterval.current);
      validationInterval.current = null;
    }

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
      (event, newSession) => {
        // Update state synchronously - never block on async operations
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && newSession?.user) {
          // Register session on login - fire and forget (non-blocking)
          registerSession(newSession.user.id);
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
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);

      if (existingSession?.user) {
        // Register/validate session for existing login - fire and forget (non-blocking)
        registerSession(existingSession.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (validationInterval.current) {
        clearInterval(validationInterval.current);
      }
    };
  }, [registerSession]);

  // Periodically validate session (every 60 seconds - reduced frequency for stability)
  useEffect(() => {
    if (user && sessionRegistered.current) {
      // Start validation after a delay to let initial setup complete
      const startDelay = setTimeout(() => {
        validationInterval.current = setInterval(async () => {
          const isValid = await validateSession(user.id);
          if (!isValid) {
            await forceLogout();
          }
        }, 60000); // Check every 60 seconds (increased from 30s for stability)
      }, 5000); // Wait 5 seconds before starting validation

      return () => {
        clearTimeout(startDelay);
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
