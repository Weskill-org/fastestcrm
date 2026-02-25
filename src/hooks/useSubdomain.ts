/**
 * useSubdomain
 *
 * Resolves the current hostname to a company record stored in Supabase.
 * Works for:
 *   • Client subdomain:   acme.fastestcrm.com  → RPC get_subdomain_company
 *   • Custom domain:      crm.acme.com         → RPC get_custom_domain_company
 *   • Main domain / dev: fastestcrm.com / localhost → no lookup
 *
 * The two RPCs are SECURITY DEFINER and GRANTed to `anon`, so they succeed
 * even before the user has signed in.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SubdomainCompany {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  is_active: boolean;
}

export interface SubdomainResult {
  /** True when on a client subdomain (slug.fastestcrm.com) */
  isSubdomain: boolean;
  /** True when on a custom domain (crm.acme.com) */
  isCustomDomain: boolean;
  /** The resolved subdomain slug, null if custom domain or main domain */
  subdomain: string | null;
  /** The resolved company, null until lookup completes or if not found */
  company: SubdomainCompany | null;
  loading: boolean;
  error: string | null;
  /** True only on the platform's own root domain */
  isMainDomain: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MAIN_DOMAIN = 'fastestcrm.com';

/** These subdomains belong to the platform, not a client workspace */
const PLATFORM_SUBDOMAINS = new Set(['www', 'app', 'api', 'admin', 'mail', 'smtp', 'ftp']);

/** How long to wait for a lookup before giving up and rendering anyway */
const LOOKUP_TIMEOUT_MS = 6_000;

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useSubdomain(): SubdomainResult {
  const [company, setCompany] = useState<SubdomainCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hostname = window.location.hostname;

  // ── Classify the current hostname ──────────────────────────────────────────
  const classify = (): {
    isMainDomain: boolean;
    isSubdomain: boolean;
    isCustomDomain: boolean;
    subdomain: string | null;
  } => {
    // Local development / CI
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
      return { isMainDomain: true, isSubdomain: false, isCustomDomain: false, subdomain: null };
    }

    // Preview / staging deployments
    if (
      hostname.endsWith('.lovable.app') ||
      hostname.endsWith('.vercel.app') ||
      hostname.endsWith('.netlify.app') ||
      hostname.endsWith('.pages.dev')
    ) {
      return { isMainDomain: true, isSubdomain: false, isCustomDomain: false, subdomain: null };
    }

    // Exact root or www of the platform domain
    if (hostname === MAIN_DOMAIN || hostname === `www.${MAIN_DOMAIN}`) {
      return { isMainDomain: true, isSubdomain: false, isCustomDomain: false, subdomain: null };
    }

    // Platform subdomain: *.fastestcrm.com
    if (hostname.endsWith(`.${MAIN_DOMAIN}`)) {
      const sub = hostname.slice(0, hostname.length - MAIN_DOMAIN.length - 1);

      // Known platform subdomains → still main domain
      if (PLATFORM_SUBDOMAINS.has(sub)) {
        return { isMainDomain: true, isSubdomain: false, isCustomDomain: false, subdomain: null };
      }

      // Client workspace subdomain
      return { isMainDomain: false, isSubdomain: true, isCustomDomain: false, subdomain: sub };
    }

    // Everything else is treated as a custom domain
    return { isMainDomain: false, isSubdomain: false, isCustomDomain: true, subdomain: null };
  };

  const { isMainDomain, isSubdomain, isCustomDomain, subdomain } = classify();

  useEffect(() => {
    // Main domain / localhost — skip all DB work immediately
    if (isMainDomain) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        console.warn('[useSubdomain] Lookup timed out — rendering without company data');
        setLoading(false);
      }
    }, LOOKUP_TIMEOUT_MS);

    const run = async () => {
      try {
        if (isSubdomain && subdomain) {
          // ── Slug-based lookup ──────────────────────────────────────────────
          const { data, error: rpcError } = await supabase
            .rpc('get_subdomain_company', { _slug: subdomain });

          if (cancelled) return;

          if (rpcError) {
            console.error('[useSubdomain] get_subdomain_company error:', rpcError);
            setError('Failed to load workspace. Please try again.');
            return;
          }

          // RPC returns TABLE — result is an array
          const rows = Array.isArray(data) ? data : data ? [data] : [];
          if (rows.length === 0) {
            setError('Workspace not found');
            return;
          }

          const row = rows[0] as SubdomainCompany;
          if (!row.is_active) {
            setError('This workspace is currently inactive');
            return;
          }

          setCompany(row);

        } else if (isCustomDomain) {
          // ── Custom-domain lookup ───────────────────────────────────────────
          const normalized = hostname.toLowerCase().replace(/^www\./, '');

          const { data, error: rpcError } = await supabase
            .rpc('get_custom_domain_company', { _domain: normalized });

          if (cancelled) return;

          if (rpcError) {
            // Fail-open: don't block users for custom-domain errors
            console.warn('[useSubdomain] get_custom_domain_company error:', rpcError);
            return;
          }

          const rows = Array.isArray(data) ? data : data ? [data] : [];
          if (rows.length > 0) {
            const row = rows[0] as SubdomainCompany;
            if (row.is_active) {
              setCompany(row);
            }
          }
        }
      } catch (err: unknown) {
        if (cancelled) return;
        console.error('[useSubdomain] Unexpected error:', err);
        // Fail-open — don't block the user
      } finally {
        if (!cancelled) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMainDomain, isSubdomain, isCustomDomain, subdomain, hostname]);

  return {
    isSubdomain,
    isCustomDomain,
    subdomain,
    company,
    loading,
    error,
    isMainDomain,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the full workspace URL for a given company slug */
export function getWorkspaceUrl(slug: string): string {
  return `https://${slug}.${MAIN_DOMAIN}`;
}

/** Returns true if the current hostname matches the given company's subdomain */
export function isCompanyWorkspace(companySlug: string): boolean {
  const hostname = window.location.hostname;
  return (
    hostname === `${companySlug}.${MAIN_DOMAIN}` ||
    // Support custom domains: compare against whatever the company registered
    // (the caller can pass company.custom_domain instead of slug if needed)
    hostname === companySlug
  );
}
