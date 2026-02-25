-- Create SECURITY DEFINER functions to bypass RLS for superfast subdomain/domain resolution
CREATE OR REPLACE FUNCTION public.get_company_by_subdomain(p_slug text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  logo_url text,
  primary_color text,
  is_active boolean
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.slug, c.logo_url, c.primary_color, c.is_active
  FROM public.companies c
  WHERE c.slug = p_slug;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_company_by_custom_domain(p_domain text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  logo_url text,
  primary_color text,
  is_active boolean
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.slug, c.logo_url, c.primary_color, c.is_active
  FROM public.companies c
  WHERE (c.custom_domain = p_domain OR c.custom_domain = 'www.' || p_domain)
  AND c.domain_status = 'active';
END;
$$ LANGUAGE plpgsql;
