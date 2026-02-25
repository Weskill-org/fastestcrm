import { createClient } from '@supabase/supabase-js';
import Cookies from 'js-cookie';
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

// ─── Standard Auth configuration ──────────────────────────────────────────────

// ─── Cookie Storage for Cross-Subdomain Auth ──────────────────────────────────
// localStorage is bound to exactly the origin (e.g. app.fastestcrm.com is isolated
// from fastestcrm.com). To make auth survive subdomain hops, we use cookies set
// on the root domain (.fastestcrm.com). Custom domains will receive standard cookies.
const cookieStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return Cookies.get(key) || null;
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

    // If we're on any fastestcrm.com domain, scope the cookie to the root domain
    // so it's shared across www., api., app., and client subdomains.
    if (hostname.endsWith('fastestcrm.com')) {
      cookieOptions.domain = '.fastestcrm.com';
    }
    // Otherwise (localhost, preview URLs, or custom client domains like crm.acme.com),
    // let the browser use the default exact hostname.

    Cookies.set(key, value, cookieOptions);
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;

    // Attempt removal on exactly the current hostname
    Cookies.remove(key, { path: '/' });

    // Also attempt removal on the root domain if applicable
    if (hostname.endsWith('fastestcrm.com')) {
      Cookies.remove(key, { path: '/', domain: '.fastestcrm.com' });
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
});
