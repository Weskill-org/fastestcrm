import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

const SESSION_TOKEN_KEY = 'app_session_token';
const MAX_SESSIONS = 2;

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

export function useSessionManager() {
  const sessionRegistered = useRef(false);
  const currentUserId = useRef<string | null>(null);

  // Register current session in database
  const registerSession = useCallback(async (userId: string) => {
    if (sessionRegistered.current && currentUserId.current === userId) {
      return true;
    }

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
        return false;
      }

      sessionRegistered.current = true;
      currentUserId.current = userId;
      return true;
    } catch (err) {
      console.error('Failed to register session:', err);
      return false;
    }
  }, []);

  // Validate if current session is still valid (among the latest 2)
  const validateSession = useCallback(async (userId: string): Promise<boolean> => {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    
    if (!sessionToken) {
      return false;
    }

    try {
      // Check if our session exists
      const { data, error } = await supabase
        .from('user_sessions')
        .select('id, created_at')
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

  // Remove current session (on logout)
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
      currentUserId.current = null;
    } catch (err) {
      console.error('Failed to remove session:', err);
    }
  }, []);

  // Clear local session token
  const clearLocalSession = useCallback(() => {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    sessionRegistered.current = false;
    currentUserId.current = null;
  }, []);

  // Get all active sessions for current user
  const getActiveSessions = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      return [];
    }
  }, []);

  // Terminate a specific session
  const terminateSession = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        console.error('Error terminating session:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Failed to terminate session:', err);
      return false;
    }
  }, []);

  // Get current session token
  const getCurrentSessionToken = useCallback(() => {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  }, []);

  return {
    registerSession,
    validateSession,
    removeSession,
    clearLocalSession,
    getActiveSessions,
    terminateSession,
    getCurrentSessionToken,
  };
}
