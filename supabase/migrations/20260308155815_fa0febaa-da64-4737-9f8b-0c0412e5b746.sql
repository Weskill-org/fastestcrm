
-- email_integrations: company-level Outlook/Gmail connection
CREATE TABLE public.email_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  provider text NOT NULL DEFAULT 'outlook',
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  admin_email text,
  is_active boolean NOT NULL DEFAULT false,
  email_dashboard_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_integrations ENABLE ROW LEVEL SECURITY;

-- Admins can manage their company's email integration
CREATE POLICY "Company admins can manage email integrations"
  ON public.email_integrations FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE admin_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE admin_id = auth.uid()));

-- Members can view their company's email integration
CREATE POLICY "Members can view email integrations"
  ON public.email_integrations FOR SELECT
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid() LIMIT 1));

-- email_aliases: per-user aliases
CREATE TABLE public.email_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  alias_email text NOT NULL,
  display_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_aliases ENABLE ROW LEVEL SECURITY;

-- Users can view their own alias
CREATE POLICY "Users can view own alias"
  ON public.email_aliases FOR SELECT
  USING (user_id = auth.uid());

-- Admins can manage all aliases in their company
CREATE POLICY "Admins can manage company aliases"
  ON public.email_aliases FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE admin_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE admin_id = auth.uid()));
