
-- Create leads_insurance table
CREATE TABLE public.leads_insurance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text,
  phone text,
  whatsapp text,
  company_id uuid REFERENCES public.companies(id),
  created_by_id uuid NOT NULL REFERENCES public.profiles(id),
  pre_sales_owner_id uuid REFERENCES public.profiles(id),
  sales_owner_id uuid REFERENCES public.profiles(id),
  post_sales_owner_id uuid REFERENCES public.profiles(id),
  
  -- Insurance-specific fields
  age integer,
  gender text,
  pan_number text,
  date_of_birth date,
  occupation text,
  annual_income numeric,
  insurance_type text,
  plan_name text,
  sum_insured numeric,
  premium_amount numeric,
  contribution_frequency text,
  policy_term integer,
  existing_policies text,
  nominee_name text,
  nominee_relation text,
  agent_name text,
  policy_number text,
  policy_start_date date,
  renewal_date date,
  loss_reason text,
  
  -- Standard CRM fields
  revenue_projected numeric,
  revenue_received numeric,
  reminder_at timestamptz,
  last_notification_sent_at timestamptz,
  payment_link text,
  lead_source text,
  lead_history jsonb,
  status_metadata jsonb,
  lead_profile jsonb,
  notes text,
  form_id uuid REFERENCES public.forms(id),
  lg_link_id uuid REFERENCES public.lg_links(id),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads_insurance ENABLE ROW LEVEL SECURITY;

-- RLS Policies (same pattern as other industry tables)
CREATE POLICY "Admins view all" ON public.leads_insurance FOR SELECT USING (
  public.has_role(auth.uid(), 'company') OR public.has_role(auth.uid(), 'company_subadmin')
);

CREATE POLICY "Users view own" ON public.leads_insurance FOR SELECT USING (
  created_by_id = auth.uid() OR
  pre_sales_owner_id = auth.uid() OR
  sales_owner_id = auth.uid() OR
  post_sales_owner_id = auth.uid()
);

CREATE POLICY "Users view hierarchy" ON public.leads_insurance FOR SELECT USING (
  public.is_in_hierarchy(auth.uid(), created_by_id) OR 
  public.is_in_hierarchy(auth.uid(), sales_owner_id)
);

CREATE POLICY "Users can create leads" ON public.leads_insurance FOR INSERT WITH CHECK (
  created_by_id = auth.uid()
);

CREATE POLICY "Users can update leads" ON public.leads_insurance FOR UPDATE USING (
  public.has_role(auth.uid(), 'company') OR 
  public.has_role(auth.uid(), 'company_subadmin') OR
  created_by_id = auth.uid() OR
  pre_sales_owner_id = auth.uid() OR
  sales_owner_id = auth.uid() OR
  post_sales_owner_id = auth.uid() OR
  public.is_in_hierarchy(auth.uid(), created_by_id) OR
  public.is_in_hierarchy(auth.uid(), sales_owner_id)
);

CREATE POLICY "Only Super Admin can delete leads" ON public.leads_insurance FOR DELETE USING (
  public.has_role(auth.uid(), 'company')
);

-- Triggers
CREATE TRIGGER update_leads_insurance_updated_at
  BEFORE UPDATE ON public.leads_insurance
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_lead_source_from_link_insurance
  BEFORE INSERT OR UPDATE ON public.leads_insurance
  FOR EACH ROW EXECUTE FUNCTION public.handle_lead_source_from_link();

CREATE TRIGGER trigger_lead_history_insurance
  BEFORE UPDATE ON public.leads_insurance
  FOR EACH ROW EXECUTE FUNCTION public.handle_lead_update_history();

-- Automation trigger
SELECT public.add_automation_trigger_to_table('leads_insurance');

-- Add metadata column to products table for insurance plan details
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS metadata jsonb;
