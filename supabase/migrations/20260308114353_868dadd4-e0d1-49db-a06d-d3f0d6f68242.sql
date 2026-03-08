
-- Create the leads_saas table for SaaS B2B industry
CREATE TABLE public.leads_saas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  whatsapp text,
  company_name text,
  company_size text,
  company_website text,
  job_title text,
  product_interest text,
  use_case text,
  current_solution text,
  demo_date timestamptz,
  trial_start_date date,
  trial_end_date date,
  plan_type text,
  seats integer,
  monthly_value numeric DEFAULT 0,
  annual_value numeric DEFAULT 0,
  contract_length integer,
  deal_stage text,
  decision_maker text,
  champion text,
  competitors text,
  loss_reason text,
  status text NOT NULL DEFAULT 'new',
  notes text,
  lead_source text,
  lead_history jsonb DEFAULT '[]'::jsonb,
  status_metadata jsonb DEFAULT '{}'::jsonb,
  lead_profile jsonb DEFAULT '{}'::jsonb,
  company_id uuid REFERENCES public.companies(id),
  created_by_id uuid NOT NULL REFERENCES public.profiles(id),
  pre_sales_owner_id uuid REFERENCES public.profiles(id),
  sales_owner_id uuid REFERENCES public.profiles(id),
  post_sales_owner_id uuid REFERENCES public.profiles(id),
  revenue_projected numeric DEFAULT 0,
  revenue_received numeric DEFAULT 0,
  reminder_at timestamptz,
  last_notification_sent_at timestamptz,
  payment_link text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  lg_link_id uuid REFERENCES public.lg_links(id),
  form_id uuid REFERENCES public.forms(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Name foreign keys explicitly for Supabase SDK joins
ALTER TABLE public.leads_saas
  DROP CONSTRAINT IF EXISTS leads_saas_created_by_id_fkey,
  ADD CONSTRAINT leads_saas_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.profiles(id),
  DROP CONSTRAINT IF EXISTS leads_saas_pre_sales_owner_id_fkey,
  ADD CONSTRAINT leads_saas_pre_sales_owner_id_fkey FOREIGN KEY (pre_sales_owner_id) REFERENCES public.profiles(id),
  DROP CONSTRAINT IF EXISTS leads_saas_sales_owner_id_fkey,
  ADD CONSTRAINT leads_saas_sales_owner_id_fkey FOREIGN KEY (sales_owner_id) REFERENCES public.profiles(id),
  DROP CONSTRAINT IF EXISTS leads_saas_post_sales_owner_id_fkey,
  ADD CONSTRAINT leads_saas_post_sales_owner_id_fkey FOREIGN KEY (post_sales_owner_id) REFERENCES public.profiles(id),
  DROP CONSTRAINT IF EXISTS leads_saas_company_id_fkey,
  ADD CONSTRAINT leads_saas_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  DROP CONSTRAINT IF EXISTS leads_saas_lg_link_id_fkey,
  ADD CONSTRAINT leads_saas_lg_link_id_fkey FOREIGN KEY (lg_link_id) REFERENCES public.lg_links(id),
  DROP CONSTRAINT IF EXISTS leads_saas_form_id_fkey,
  ADD CONSTRAINT leads_saas_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.forms(id);

-- Enable RLS
ALTER TABLE public.leads_saas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view saas leads"
ON public.leads_saas FOR SELECT TO authenticated
USING (
  is_same_company(auth.uid(), company_id) AND (
    created_by_id = auth.uid() OR
    pre_sales_owner_id = auth.uid() OR
    sales_owner_id = auth.uid() OR
    post_sales_owner_id = auth.uid() OR
    is_in_hierarchy(auth.uid(), COALESCE(sales_owner_id, created_by_id))
  )
);

CREATE POLICY "Users can create saas leads"
ON public.leads_saas FOR INSERT TO authenticated
WITH CHECK (
  created_by_id = auth.uid() AND is_same_company(auth.uid(), company_id)
);

CREATE POLICY "Users can update saas leads"
ON public.leads_saas FOR UPDATE TO authenticated
USING (
  is_same_company(auth.uid(), company_id) AND (
    created_by_id = auth.uid() OR
    pre_sales_owner_id = auth.uid() OR
    sales_owner_id = auth.uid() OR
    post_sales_owner_id = auth.uid() OR
    is_in_hierarchy(auth.uid(), COALESCE(sales_owner_id, created_by_id))
  )
);

CREATE POLICY "Admins can delete saas leads"
ON public.leads_saas FOR DELETE TO authenticated
USING (
  (has_role(auth.uid(), 'company') OR has_role(auth.uid(), 'company_subadmin'))
  AND is_same_company(auth.uid(), company_id)
);

-- Indexes
CREATE INDEX idx_leads_saas_company_id ON public.leads_saas(company_id);
CREATE INDEX idx_leads_saas_status ON public.leads_saas(status);
CREATE INDEX idx_leads_saas_sales_owner_id ON public.leads_saas(sales_owner_id);
CREATE INDEX idx_leads_saas_created_at ON public.leads_saas(created_at DESC);
