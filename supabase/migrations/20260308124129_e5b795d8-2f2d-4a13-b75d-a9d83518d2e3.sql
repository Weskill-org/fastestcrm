
-- Create leads_healthcare table
CREATE TABLE public.leads_healthcare (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id),
  created_by_id uuid NOT NULL REFERENCES public.profiles(id),
  pre_sales_owner_id uuid REFERENCES public.profiles(id),
  sales_owner_id uuid REFERENCES public.profiles(id),
  post_sales_owner_id uuid REFERENCES public.profiles(id),
  name text NOT NULL,
  email text,
  phone text,
  whatsapp text,
  status text NOT NULL DEFAULT 'new_enquiry',
  notes text,
  lead_source text,
  lead_history jsonb DEFAULT '[]'::jsonb,
  status_metadata jsonb DEFAULT '{}'::jsonb,
  lead_profile jsonb DEFAULT '{}'::jsonb,
  revenue_projected numeric DEFAULT 0,
  revenue_received numeric DEFAULT 0,
  payment_link text,
  reminder_at timestamptz,
  last_notification_sent_at timestamptz,
  lg_link_id uuid REFERENCES public.lg_links(id),
  form_id uuid REFERENCES public.forms(id),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  -- Healthcare-specific fields
  age integer,
  gender text,
  condition text,
  symptoms text,
  department text,
  doctor_preference text,
  appointment_date timestamptz,
  appointment_time text,
  referral_source text,
  insurance_provider text,
  insurance_id text,
  treatment_type text,
  treatment_cost numeric,
  treatment_date date,
  follow_up_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads_healthcare ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as leads_saas)
CREATE POLICY "Admins can delete healthcare leads"
  ON public.leads_healthcare FOR DELETE
  USING ((has_role(auth.uid(), 'company') OR has_role(auth.uid(), 'company_subadmin')) AND is_same_company(auth.uid(), company_id));

CREATE POLICY "Users can create healthcare leads"
  ON public.leads_healthcare FOR INSERT
  WITH CHECK ((created_by_id = auth.uid()) AND is_same_company(auth.uid(), company_id));

CREATE POLICY "Users can update healthcare leads"
  ON public.leads_healthcare FOR UPDATE
  USING (is_same_company(auth.uid(), company_id) AND (
    created_by_id = auth.uid() OR
    pre_sales_owner_id = auth.uid() OR
    sales_owner_id = auth.uid() OR
    post_sales_owner_id = auth.uid() OR
    is_in_hierarchy(auth.uid(), COALESCE(sales_owner_id, created_by_id))
  ));

CREATE POLICY "Users can view healthcare leads"
  ON public.leads_healthcare FOR SELECT
  USING (is_same_company(auth.uid(), company_id) AND (
    created_by_id = auth.uid() OR
    pre_sales_owner_id = auth.uid() OR
    sales_owner_id = auth.uid() OR
    post_sales_owner_id = auth.uid() OR
    is_in_hierarchy(auth.uid(), COALESCE(sales_owner_id, created_by_id))
  ));

-- Index for common queries
CREATE INDEX idx_leads_healthcare_company_status ON public.leads_healthcare(company_id, status);
CREATE INDEX idx_leads_healthcare_sales_owner ON public.leads_healthcare(sales_owner_id);
CREATE INDEX idx_leads_healthcare_created_at ON public.leads_healthcare(created_at DESC);
