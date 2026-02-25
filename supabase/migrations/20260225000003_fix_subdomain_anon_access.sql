-- =============================================================================
-- Migration: Fix subdomain/custom-domain lookup for unauthenticated visitors
-- =============================================================================
-- Problem: The SECURITY DEFINER RPCs get_subdomain_company and
--          get_custom_domain_company bypass RLS correctly, but they were never
--          GRANTed to the `anon` role. Unauthenticated visitors hitting a
--          subdomain (e.g. acme.fastestcrm.com) or custom domain therefore
--          receive a "permission denied for function" error and can't see the
--          branded login page.
--
-- Fix:  1. Drop and recreate both RPCs cleanly (idempotent).
--       2. GRANT EXECUTE to both `anon` and `authenticated`.
--       3. The SECURITY DEFINER flag means the function runs as the DB owner
--          and can read `companies` regardless of RLS – this is safe because
--          the functions only expose the minimum public fields needed for
--          branding (id, name, slug, logo_url, primary_color, is_active).
-- =============================================================================

-- ── Drop any stale versions ───────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_subdomain_company(text);
DROP FUNCTION IF EXISTS public.get_subdomain_company(_slug text);
DROP FUNCTION IF EXISTS public.get_custom_domain_company(text);
DROP FUNCTION IF EXISTS public.get_custom_domain_company(_domain text);

-- ── Subdomain (slug) lookup ───────────────────────────────────────────────────
CREATE FUNCTION public.get_subdomain_company(_slug text)
RETURNS TABLE (
  id          uuid,
  name        text,
  slug        text,
  logo_url    text,
  primary_color text,
  is_active   boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    c.id,
    c.name,
    c.slug,
    c.logo_url,
    c.primary_color,
    c.is_active
  FROM public.companies c
  WHERE c.slug = _slug
    AND c.is_active = true
  LIMIT 1;
$$;

-- Grant to both unauthenticated (anon) and authenticated users
GRANT EXECUTE ON FUNCTION public.get_subdomain_company(text) TO anon, authenticated;

-- ── Custom-domain lookup ──────────────────────────────────────────────────────
CREATE FUNCTION public.get_custom_domain_company(_domain text)
RETURNS TABLE (
  id          uuid,
  name        text,
  slug        text,
  logo_url    text,
  primary_color text,
  is_active   boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    c.id,
    c.name,
    c.slug,
    c.logo_url,
    c.primary_color,
    c.is_active
  FROM public.companies c
  WHERE
    -- Match both "example.com" and "www.example.com" stored values
    (
      c.custom_domain = _domain
      OR c.custom_domain = 'www.' || _domain
      OR 'www.' || c.custom_domain = _domain
    )
    AND c.domain_status = 'active'
    AND c.is_active = true
  LIMIT 1;
$$;

-- Grant to both unauthenticated (anon) and authenticated users
GRANT EXECUTE ON FUNCTION public.get_custom_domain_company(text) TO anon, authenticated;

-- ── Ensure indexes exist for fast unauthenticated lookups ────────────────────
-- (Idempotent – IF NOT EXISTS guards against re-run errors)

CREATE INDEX IF NOT EXISTS idx_companies_slug_active
  ON public.companies (slug, is_active);

CREATE INDEX IF NOT EXISTS idx_companies_custom_domain_active
  ON public.companies (custom_domain, domain_status, is_active)
  WHERE custom_domain IS NOT NULL;
