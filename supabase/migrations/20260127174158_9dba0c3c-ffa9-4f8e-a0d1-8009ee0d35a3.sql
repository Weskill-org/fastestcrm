-- Real Estate Leads Table with industry-specific columns
CREATE TABLE public.leads_real_estate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id),
    created_by_id UUID NOT NULL REFERENCES public.profiles(id),
    
    -- Core lead info
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    lead_source TEXT,
    
    -- Lead owners (pre-sales, sales, post-sales)
    pre_sales_owner_id UUID REFERENCES public.profiles(id),
    sales_owner_id UUID REFERENCES public.profiles(id),
    post_sales_owner_id UUID REFERENCES public.profiles(id),
    
    -- Real estate specific fields
    property_type TEXT, -- Apartment, Villa, Plot, Commercial, etc.
    budget_min NUMERIC,
    budget_max NUMERIC,
    preferred_location TEXT,
    property_size TEXT, -- sq ft or BHK
    purpose TEXT, -- buy, rent, invest
    possession_timeline TEXT,
    broker_name TEXT,
    
    -- Property deal info
    property_name TEXT,
    unit_number TEXT,
    deal_value NUMERIC,
    commission_percentage NUMERIC,
    commission_amount NUMERIC,
    
    -- Lead profiling (nested structure stored as JSON)
    lead_profile JSONB DEFAULT '{}'::jsonb,
    
    -- Notes
    notes TEXT,
    
    -- Status with JSON metadata (for site visit date/time, RCB date/time, etc.)
    status TEXT NOT NULL DEFAULT 'new',
    status_metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Site visit verification
    site_visit_photos JSONB DEFAULT '[]'::jsonb, -- Array of {url, timestamp, lat, lng, verified}
    
    -- Financial
    revenue_projected NUMERIC DEFAULT 0,
    revenue_received NUMERIC DEFAULT 0,
    payment_link TEXT,
    
    -- UTM tracking
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    
    -- Form/link tracking
    form_id UUID REFERENCES public.forms(id),
    lg_link_id UUID REFERENCES public.lg_links(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads_real_estate ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Real Estate Leads
CREATE POLICY "Admins view all real estate leads" ON public.leads_real_estate
FOR SELECT USING (
    has_role(auth.uid(), 'company') OR 
    has_role(auth.uid(), 'company_subadmin')
);

CREATE POLICY "Users view own real estate leads" ON public.leads_real_estate
FOR SELECT USING (
    created_by_id = auth.uid() OR
    pre_sales_owner_id = auth.uid() OR
    sales_owner_id = auth.uid() OR
    post_sales_owner_id = auth.uid()
);

CREATE POLICY "Users view hierarchy real estate leads" ON public.leads_real_estate
FOR SELECT USING (
    is_in_hierarchy(auth.uid(), created_by_id) OR 
    is_in_hierarchy(auth.uid(), sales_owner_id)
);

CREATE POLICY "Users can create real estate leads" ON public.leads_real_estate
FOR INSERT WITH CHECK (created_by_id = auth.uid());

CREATE POLICY "Users can update real estate leads" ON public.leads_real_estate
FOR UPDATE USING (
    has_role(auth.uid(), 'company') OR 
    has_role(auth.uid(), 'company_subadmin') OR
    created_by_id = auth.uid() OR
    pre_sales_owner_id = auth.uid() OR
    sales_owner_id = auth.uid() OR
    post_sales_owner_id = auth.uid() OR
    is_in_hierarchy(auth.uid(), created_by_id) OR
    is_in_hierarchy(auth.uid(), sales_owner_id)
);

CREATE POLICY "Admins can delete real estate leads" ON public.leads_real_estate
FOR DELETE USING (
    has_role(auth.uid(), 'company') OR 
    has_role(auth.uid(), 'company_subadmin')
);

-- Trigger for updated_at
CREATE TRIGGER update_leads_real_estate_updated_at
BEFORE UPDATE ON public.leads_real_estate
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Lead Profiling Configuration Table
CREATE TABLE public.lead_profiling_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    industry TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, industry)
);

-- Enable RLS
ALTER TABLE public.lead_profiling_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Company admins can manage profiling config" ON public.lead_profiling_config
FOR ALL USING (
    company_id IN (SELECT id FROM companies WHERE admin_id = auth.uid()) OR
    has_role(auth.uid(), 'company') OR 
    has_role(auth.uid(), 'company_subadmin')
);

CREATE POLICY "Users can view profiling config" ON public.lead_profiling_config
FOR SELECT USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_lead_profiling_config_updated_at
BEFORE UPDATE ON public.lead_profiling_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create index for performance
CREATE INDEX idx_leads_real_estate_company_id ON public.leads_real_estate(company_id);
CREATE INDEX idx_leads_real_estate_status ON public.leads_real_estate(status);
CREATE INDEX idx_leads_real_estate_created_at ON public.leads_real_estate(created_at DESC);
CREATE INDEX idx_lead_profiling_config_company ON public.lead_profiling_config(company_id);