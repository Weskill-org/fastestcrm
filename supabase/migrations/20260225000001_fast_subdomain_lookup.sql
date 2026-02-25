-- Migration: Fast Subdomain Lookup RPCs
-- Description: Creates SECURITY DEFINER functions to securely fetch public company data without RLS overhead.

-- 1. Create a type to represent the public company data returned
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'public_company_info') THEN
    CREATE TYPE public.public_company_info AS (
      id uuid,
      name text,
      slug text,
      logo_url text,
      primary_color text,
      is_active boolean
    );
  END IF;
END $$;

-- 2. Function to look up by slug (subdomain)
CREATE OR REPLACE FUNCTION public.get_subdomain_company(_slug text)
RETURNS public.public_company_info
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

-- 3. Function to look up by custom domain
CREATE OR REPLACE FUNCTION public.get_custom_domain_company(_domain text)
RETURNS public.public_company_info
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
