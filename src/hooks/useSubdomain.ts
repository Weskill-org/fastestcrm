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

export function useSubdomain(): SubdomainResult {
  const [company, setCompany] = useState<SubdomainCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hostname = window.location.hostname;

  // Determine if we're on a subdomain
  const getSubdomainInfo = () => {
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return { isSubdomain: false, subdomain: null, isMainDomain: true };
    }

    // Preview/staging domains (lovable.app, vercel.app, etc.)
    if (hostname.includes('lovable.app') || hostname.includes('vercel.app') || hostname.includes('netlify.app')) {
      return { isSubdomain: false, subdomain: null, isMainDomain: true };
    }

    // Check if it's the main domain or a subdomain of fastestcrm.com
    if (hostname === MAIN_DOMAIN || hostname === `www.${MAIN_DOMAIN}`) {
      return { isSubdomain: false, subdomain: null, isMainDomain: true };
    }

    // Check for subdomain of main domain
    if (hostname.endsWith(`.${MAIN_DOMAIN}`)) {
      const subdomain = hostname.replace(`.${MAIN_DOMAIN}`, '');

      // Skip system subdomains
      if (ALLOWED_SUBDOMAINS.includes(subdomain)) {
        return { isSubdomain: false, subdomain: null, isMainDomain: true };
      }

      return { isSubdomain: true, subdomain, isMainDomain: false };
    }

    // Custom domain - try to resolve it
    return { isSubdomain: false, subdomain: null, isMainDomain: false, isCustomDomain: true };
  };

  const { isSubdomain, subdomain, isMainDomain } = getSubdomainInfo();

  useEffect(() => {
    const fetchCompanyBySubdomain = async () => {
      if (!subdomain) {
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .rpc('get_subdomain_company', { _slug: subdomain })
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching company:', fetchError);
          // If it's a timeout/failed to fetch, we don't want to completely block the user
          // if they are just trying to log in. We'll set a specific error.
          if (fetchError.message?.includes('Failed to fetch') ||
            fetchError.message?.includes('timeout') ||
            fetchError.message?.includes('network')) {
            setError('Network error: Could not reach server. Your connection might be blocking the request.');
          } else {
            setError('Failed to load workspace');
          }
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

        setCompany(data);
      } catch (err: any) {
        console.error('Error in useSubdomain:', err);
        if (err?.message?.includes('Failed to fetch') || err?.message?.includes('network')) {
          setError('Network error: Could not reach server. Your connection might be blocking the request.');
        } else {
          setError('Failed to load workspace');
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchCompanyByCustomDomain = async () => {
      // Check if this is a custom domain
      if (isMainDomain || isSubdomain) {
        setLoading(false);
        return;
      }

      try {
        // Normalize hostname: remove www. and make lowercase
        const normalizedHostname = hostname.toLowerCase().replace(/^www\./, '');

        // Try to find company with this custom domain
        // We check both with and without www to be safe, though we encourage valid entries in DB
        const { data, error: fetchError } = await supabase
          .rpc('get_custom_domain_company', { _domain: normalizedHostname })
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching company by domain:', fetchError);
          // Don't set a hard error here that breaks the app if it's just a network issue
          // It's better to let them fallback to the main app if the custom domain lookup times out
          return;
        }

        if (data && data.is_active) {
          setCompany(data);
        }
      } catch (err) {
        console.error('Error in useSubdomain custom domain:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isSubdomain && subdomain) {
      fetchCompanyBySubdomain();
    } else if (!isMainDomain) {
      fetchCompanyByCustomDomain();
    } else {
      setLoading(false);
    }
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

// Helper to generate workspace URL
export function getWorkspaceUrl(slug: string): string {
  return `https://${slug}.${MAIN_DOMAIN}`;
}

// Helper to check if current URL matches a company
export function isCompanyWorkspace(companySlug: string): boolean {
  const hostname = window.location.hostname;
  return hostname === `${companySlug}.${MAIN_DOMAIN}`;
}
