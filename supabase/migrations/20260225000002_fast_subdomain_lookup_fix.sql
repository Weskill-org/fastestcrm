-- Migration: Fast Subdomain Lookup RPCs Fix
-- Description: Changes return type to TABLE to prevent PostgREST JSON wrapper issues.

-- Drop previous versions to change return type
DROP FUNCTION IF EXISTS public.get_subdomain_company(_slug text);
DROP FUNCTION IF EXISTS public.get_custom_domain_company(_domain text);
DROP TYPE IF EXISTS public.public_company_info;

-- Function to look up by slug (subdomain)
CREATE OR REPLACE FUNCTION public.get_subdomain_company(_slug text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  logo_url text,
  primary_color text,
  is_active boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    id, 
    name, 
    slug, 
    logo_url, 
    primary_color, 
    is_active
  FROM public.companies
  WHERE slug = _slug
  LIMIT 1;
$$;

-- Function to look up by custom domain
CREATE OR REPLACE FUNCTION public.get_custom_domain_company(_domain text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  logo_url text,
  primary_color text,
  is_active boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    id, 
    name, 
    slug, 
    logo_url, 
    primary_color, 
    is_active
  FROM public.companies
  WHERE 
    -- Match custom domain EXACTLY
    (custom_domain = _domain OR custom_domain = 'www.' || _domain)
    AND domain_status = 'active'
  LIMIT 1;
$$;
