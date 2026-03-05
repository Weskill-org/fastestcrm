import { createClient } from '@supabase/supabase-js';

import type { Database } from './types';

// ─── Environment ─────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://api.fastestcrm.com";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// ─── Startup guard ────────────────────────────────────────────────────────────
if (!SUPABASE_URL || !SUPABASE_URL.startsWith('http')) {
  console.error(
    '[Supabase] ❌ VITE_SUPABASE_URL is missing or malformed:',
    JSON.stringify(SUPABASE_URL)
  );
}

// ─── Standard Auth configuration ──────────────────────────────────────────────


// ─── Supabase client ──────────────────────────────────────────────────────────
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    // Add 10s margin for refresh retry logic
    storageKey: 'sb-auth-token',
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
  },
});

// A lightweight, unauthenticated client strictly used for fast public lookups (e.g. subdomains)
// It deliberately ignores the session so requests are not delayed by session hydration.
export const anonSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
