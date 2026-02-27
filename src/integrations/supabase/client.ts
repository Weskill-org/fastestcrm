import { createClient } from '@supabase/supabase-js';
import Cookies from 'js-cookie';
import type { Database } from './types';

// ─── Environment ─────────────────────────────────────────────────────────────
// api.fastestcrm.com is a custom domain that points directly to Supabase.
// The Vercel frontend (fastestcrm.com) does NOT proxy API traffic —
// the browser hits api.fastestcrm.com directly for all REST/Auth/Storage calls.
const SUPABASE_URL = "https://api.fastestcrm.com";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// Realtime WebSockets must bypass the api.fastestcrm.com domain entirely
// if it does not support WebSocket upgrades. We fall back to the direct
// Supabase project URL for the persistent WS connection.
const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'uykdyqdeyilpulaqlqip';
const REALTIME_URL = `wss://${SUPABASE_PROJECT_ID}.supabase.co/realtime/v1`;

// ─── Startup guard ────────────────────────────────────────────────────────────
if (!SUPABASE_URL || !SUPABASE_URL.startsWith('http')) {
  console.error(
    '[Supabase] ❌ VITE_SUPABASE_URL is missing or malformed:',
    JSON.stringify(SUPABASE_URL)
  );
}

// ─── Standard Auth configuration ──────────────────────────────────────────────

// ─── Cookie Storage for Cross-Subdomain Auth ──────────────────────────────────
// localStorage is bound to exactly the origin (e.g. app.fastestcrm.com is isolated
// from fastestcrm.com). To make auth survive subdomain hops, we use cookies set
// on the root domain (.fastestcrm.com). Custom domains will receive standard cookies.
// Browsers limit cookies to 4KB. Supabase sessions often exceed this, so we MUST chunk them.
const MAX_COOKIE_SIZE = 3000;

const cookieStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    let value = '';
    let i = 0;
    while (true) {
      const chunk = Cookies.get(`${key}_${i}`);
      if (chunk) {
        value += chunk;
        i++;
      } else {
        break;
      }
    }
    // Fallback for legacy un-chunked cookies
    if (!value) {
      value = Cookies.get(key) || '';
    }
    return value || null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    const cookieOptions: Cookies.CookieAttributes = {
      expires: 365,
      path: '/',
      secure: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
      sameSite: 'None', // Critical for cross-subdomain auth in strict browsers like Safari/Brave
    };

    if (hostname.endsWith('fastestcrm.com')) {
      cookieOptions.domain = '.fastestcrm.com';
    }

    // Clean legacy un-chunked
    Cookies.remove(key, { path: '/' });
    if (cookieOptions.domain) Cookies.remove(key, { path: '/', domain: cookieOptions.domain });

    // Split value into chunks safely under 4KB
    const chunks = [];
    for (let c = 0; c < value.length; c += MAX_COOKIE_SIZE) {
      chunks.push(value.slice(c, c + MAX_COOKIE_SIZE));
    }

    // Set new chunks
    chunks.forEach((chunk, index) => {
      Cookies.set(`${key}_${index}`, chunk, cookieOptions);
    });

    // Remove any trailing chunks from a previously larger session
    let cleanupIndex = chunks.length;
    while (Cookies.get(`${key}_${cleanupIndex}`)) {
      Cookies.remove(`${key}_${cleanupIndex}`, { path: '/' });
      if (cookieOptions.domain) Cookies.remove(`${key}_${cleanupIndex}`, { path: '/', domain: cookieOptions.domain });
      cleanupIndex++;
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    const domain = hostname.endsWith('fastestcrm.com') ? '.fastestcrm.com' : undefined;

    // Remove legacy un-chunked
    Cookies.remove(key, { path: '/' });
    if (domain) Cookies.remove(key, { path: '/', domain });

    // Remove chunks
    let i = 0;
    let hasChunk = true;
    while (hasChunk || i < 10) { // Check up to 10 chunks to be completely safe
      const exists = Cookies.get(`${key}_${i}`);
      if (!exists && i > 5) hasChunk = false;

      Cookies.remove(`${key}_${i}`, { path: '/' });
      if (domain) Cookies.remove(`${key}_${i}`, { path: '/', domain });

      i++;
    }
  },
};

// ─── Supabase client ──────────────────────────────────────────────────────────
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: cookieStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Add 10s margin for refresh retry logic
    storageKey: 'sb-auth-token',
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  realtime: ({
    // Vercel cannot proxy WebSockets — bypass the proxy for Realtime only.
    // Cast needed: 'url' is valid at runtime but missing from the type defs
    // in this version of @supabase/supabase-js.
    url: REALTIME_URL,
  } as any),
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
