import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ─── Environment ─────────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// ─── Startup guard ────────────────────────────────────────────────────────────
if (!SUPABASE_URL || SUPABASE_URL.startsWith('"') || !SUPABASE_URL.startsWith('http')) {
  console.error(
    '[Supabase] ❌ VITE_SUPABASE_URL is missing or malformed:',
    JSON.stringify(SUPABASE_URL),
    '\n→ Open .env and ensure the value has NO surrounding quotes.'
  );
}

// ─── crypto.randomUUID polyfill ───────────────────────────────────────────────
// Needed on HTTP (non-secure) contexts and some older browsers.
if (typeof crypto !== 'undefined' && typeof crypto.randomUUID !== 'function') {
  (crypto as any).randomUUID = function (): `${string}-${string}-${string}-${string}-${string}` {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant bits
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}` as any;
  };
}

// ─── Fetch with timeout ───────────────────────────────────────────────────────
// The native supabase-js client has no built-in timeout. Without one, any
// blocked request will hang the browser indefinitely.
const TIMEOUT_MS = 15_000; // 15 s — sensible for auth + data calls

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  // Merge caller's signal with our timeout signal if one exists
  const signal = init?.signal
    ? anySignal([init.signal, controller.signal])
    : controller.signal;

  return fetch(input, { ...init, signal }).finally(() => clearTimeout(timer));
}

/** Abort as soon as any supplied signal fires */
function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const sig of signals) {
    if (sig.aborted) {
      controller.abort(sig.reason);
      break;
    }
    sig.addEventListener('abort', () => controller.abort(sig.reason), { once: true });
  }
  return controller.signal;
}

// ─── In development, route through Vite's proxy to bypass ISP/firewall blocks ─
// In production the direct SUPABASE_URL is used (no proxy needed).
const supabaseUrl =
  import.meta.env.DEV
    ? `${window.location.origin}/supabase-proxy`
    : SUPABASE_URL;

// ─── Supabase client ──────────────────────────────────────────────────────────
export const supabase = createClient<Database>(supabaseUrl, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: fetchWithTimeout,
  },
});