import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubdomainCompany {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  is_active: boolean;
}

interface SubdomainResult {
  isSubdomain: boolean;
  subdomain: string | null;
  company: SubdomainCompany | null;
  loading: boolean;
  error: string | null;
  isMainDomain: boolean;
}

const MAIN_DOMAIN = 'fastestcrm.com';
const ALLOWED_SUBDOMAINS = ['www', 'app', 'api', 'admin'];
// Subdomain lookup should never take longer than this
const SUBDOMAIN_LOOKUP_TIMEOUT_MS = 8_000;

export function useSubdomain(): SubdomainResult {
  const [company, setCompany] = useState<SubdomainCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hostname = window.location.hostname;

  // ── Determine if we're on a subdomain ────────────────────────────────────
  const getSubdomainInfo = () => {
    // Local development — always treat as main domain
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return { isSubdomain: false, subdomain: null, isMainDomain: true };
    }

    // Preview/staging domains (lovable, Vercel, Netlify, etc.)
    if (
      hostname.includes('lovable.app') ||
      hostname.includes('vercel.app') ||
      hostname.includes('netlify.app')
    ) {
      return { isSubdomain: false, subdomain: null, isMainDomain: true };
    }

    // Main domain root
    if (hostname === MAIN_DOMAIN || hostname === `www.${MAIN_DOMAIN}`) {
      return { isSubdomain: false, subdomain: null, isMainDomain: true };
    }

    // Subdomain of main domain
    if (hostname.endsWith(`.${MAIN_DOMAIN}`)) {
      const subdomain = hostname.replace(`.${MAIN_DOMAIN}`, '');

      if (ALLOWED_SUBDOMAINS.includes(subdomain)) {
        return { isSubdomain: false, subdomain: null, isMainDomain: true };
      }

      return { isSubdomain: true, subdomain, isMainDomain: false };
    }

    // Custom domain — try to resolve it
    return { isSubdomain: false, subdomain: null, isMainDomain: false };
  };

  const { isSubdomain, subdomain, isMainDomain } = getSubdomainInfo();

  useEffect(() => {
    // If we're on the main domain / localhost, skip all DB lookups immediately
    if (isMainDomain) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    // Safety valve — if the whole lookup takes longer than the timeout,
    // we give up and let the app continue (fail-open for UX).
    const safetyTimer = setTimeout(() => {
      console.warn('[useSubdomain] Lookup timed out — continuing without company data');
      setLoading(false);
      controller.abort();
    }, SUBDOMAIN_LOOKUP_TIMEOUT_MS);

    const run = async () => {
      try {
        if (isSubdomain && subdomain) {
          // ── Subdomain lookup ────────────────────────────────────────────
          const { data, error: fetchError } = await supabase
            .rpc('get_subdomain_company', { _slug: subdomain })
            .maybeSingle();

          if (controller.signal.aborted) return;

          if (fetchError) {
            console.error('[useSubdomain] RPC error (subdomain):', fetchError);
            const isNetworkErr =
              fetchError.message?.includes('Failed to fetch') ||
              fetchError.message?.includes('timeout') ||
              fetchError.message?.includes('network') ||
              fetchError.message?.includes('abort');

            setError(
              isNetworkErr
                ? 'Network error: Could not reach server. Please check your connection.'
                : 'Failed to load workspace'
            );
            return;
          }

          if (!data) {
            setError('Workspace not found');
            return;
          }

          if (!data.is_active) {
            setError('This workspace is currently inactive');
            return;
          }

          setCompany(data as SubdomainCompany);
        } else {
          // ── Custom domain lookup ────────────────────────────────────────
          const normalizedHostname = hostname.toLowerCase().replace(/^www\./, '');

          const { data, error: fetchError } = await supabase
            .rpc('get_custom_domain_company', { _domain: normalizedHostname })
            .maybeSingle();

          if (controller.signal.aborted) return;

          if (fetchError) {
            console.warn('[useSubdomain] RPC error (custom domain):', fetchError);
            // Fail-open: don't block the user for a custom-domain lookup failure
            return;
          }

          if (data && data.is_active) {
            setCompany(data as SubdomainCompany);
          }
        }
      } catch (err: any) {
        if (controller.signal.aborted) return; // expected abort — ignore
        console.error('[useSubdomain] Unexpected error:', err);
        // Fail-open
      } finally {
        if (!controller.signal.aborted) {
          clearTimeout(safetyTimer);
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      controller.abort();
      clearTimeout(safetyTimer);
    };
  }, [subdomain, isSubdomain, isMainDomain, hostname]);

  return {
    isSubdomain,
    subdomain,
    company,
    loading,
    error,
    isMainDomain,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the full workspace URL for a given company slug */
export function getWorkspaceUrl(slug: string): string {
  return `https://${slug}.${MAIN_DOMAIN}`;
}

/** Returns true if the current hostname matches the given company's subdomain */
export function isCompanyWorkspace(companySlug: string): boolean {
  const hostname = window.location.hostname;
  return hostname === `${companySlug}.${MAIN_DOMAIN}`;
}
