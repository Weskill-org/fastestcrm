
-- Create leads_travel table
CREATE TABLE public.leads_travel (
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
  status text NOT NULL DEFAULT 'new',
  notes text,
  lead_source text,
  lead_history jsonb DEFAULT '[]'::jsonb,
  status_metadata jsonb DEFAULT '{}'::jsonb,
  lead_profile jsonb DEFAULT '{}'::jsonb,
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
  -- Travel-specific columns
  destination text,
  travel_date date,
  return_date date,
  travelers_count integer,
  trip_type text,
  package_type text,
  budget numeric,
  special_requests text,
  hotel_name text,
  flight_details text,
  package_cost numeric,
  advance_paid numeric,
  balance_due numeric,
  booking_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads_travel ENABLE ROW LEVEL SECURITY;

-- RLS Policies (same pattern as other industries)
CREATE POLICY "Admins view all" ON public.leads_travel
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'company') OR has_role(auth.uid(), 'company_subadmin'));

CREATE POLICY "Users view own" ON public.leads_travel
  FOR SELECT TO authenticated
  USING (
    created_by_id = auth.uid() OR
    pre_sales_owner_id = auth.uid() OR
    sales_owner_id = auth.uid() OR
    post_sales_owner_id = auth.uid()
  );

CREATE POLICY "Users view hierarchy" ON public.leads_travel
  FOR SELECT TO authenticated
  USING (
    is_in_hierarchy(auth.uid(), created_by_id) OR
    is_in_hierarchy(auth.uid(), sales_owner_id)
  );

CREATE POLICY "Users can create leads" ON public.leads_travel
  FOR INSERT TO authenticated
  WITH CHECK (created_by_id = auth.uid());

CREATE POLICY "Users can update leads" ON public.leads_travel
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'company') OR
    has_role(auth.uid(), 'company_subadmin') OR
    created_by_id = auth.uid() OR
    pre_sales_owner_id = auth.uid() OR
    sales_owner_id = auth.uid() OR
    post_sales_owner_id = auth.uid() OR
    is_in_hierarchy(auth.uid(), created_by_id) OR
    is_in_hierarchy(auth.uid(), sales_owner_id)
  );

CREATE POLICY "Only Super Admin can delete leads" ON public.leads_travel
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'company'));

-- Updated_at trigger
CREATE TRIGGER update_leads_travel_updated_at
  BEFORE UPDATE ON public.leads_travel
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
