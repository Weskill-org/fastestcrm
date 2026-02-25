import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ─── Environment ─────────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// ─── Startup guard ────────────────────────────────────────────────────────────
if (!SUPABASE_URL || !SUPABASE_URL.startsWith('http')) {
  console.error(
    '[Supabase] ❌ VITE_SUPABASE_URL is missing or malformed:',
    JSON.stringify(SUPABASE_URL)
  );
}

// ─── crypto and randomUUID polyfill fallback ────────────────────────────────────
// Browsers completely disable `crypto` or `crypto.randomUUID` on non-secure (HTTP) 
// contexts (like when accessing your computer's IP from a mobile network). 
// This math-based fallback ensures Supabase and session logic NEVER crash.
if (typeof window !== 'undefined') {
  if (!window.crypto) {
    (window as any).crypto = {};
  }
  if (!window.crypto.randomUUID) {
    (window.crypto as any).randomUUID = function (): `${string}-${string}-${string}-${string}-${string}` {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }) as any;
    };
  }
}


// ─── Supabase client ──────────────────────────────────────────────────────────
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
