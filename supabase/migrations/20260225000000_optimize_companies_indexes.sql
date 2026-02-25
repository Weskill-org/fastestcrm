-- Optimize companies queries and prevent timeout

-- Drop the old partial index as it isn't being used cleanly by PostgREST OR statements
DROP INDEX IF EXISTS idx_companies_custom_domain;

-- Add a non-partial index for custom_domain
CREATE INDEX IF NOT EXISTS idx_companies_custom_domain_full ON public.companies(custom_domain);

-- Add a compound index to cover the exact useSubdomain querying pattern
CREATE INDEX IF NOT EXISTS idx_companies_subdomain_lookup 
ON public.companies(custom_domain, domain_status, is_active);

CREATE INDEX IF NOT EXISTS idx_companies_slug_lookup 
ON public.companies(slug, is_active);
