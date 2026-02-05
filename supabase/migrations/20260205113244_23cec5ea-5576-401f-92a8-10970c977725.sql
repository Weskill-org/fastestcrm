-- Create table for performance marketing integrations
CREATE TABLE public.performance_marketing_integrations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('meta', 'google', 'linkedin')),
    is_active BOOLEAN DEFAULT true,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    page_id TEXT, -- For Meta
    page_name TEXT,
    ad_account_id TEXT,
    default_lead_status TEXT DEFAULT 'new',
    webhook_verify_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(company_id, platform)
);

-- Create table for connected campaigns/forms
CREATE TABLE public.marketing_campaign_connections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    integration_id UUID NOT NULL REFERENCES public.performance_marketing_integrations(id) ON DELETE CASCADE,
    campaign_id TEXT NOT NULL,
    campaign_name TEXT NOT NULL,
    form_id TEXT,
    form_name TEXT,
    lead_status TEXT DEFAULT 'new',
    is_active BOOLEAN DEFAULT true,
    leads_received INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.performance_marketing_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaign_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for performance_marketing_integrations
CREATE POLICY "Company admins can manage integrations"
ON public.performance_marketing_integrations FOR ALL
USING (
    company_id IN (
        SELECT id FROM public.companies WHERE admin_id = auth.uid()
    )
    OR has_role(auth.uid(), 'company'::app_role)
    OR has_role(auth.uid(), 'company_subadmin'::app_role)
);

CREATE POLICY "Users can view their company integrations"
ON public.performance_marketing_integrations FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- RLS Policies for marketing_campaign_connections
CREATE POLICY "Company admins can manage campaign connections"
ON public.marketing_campaign_connections FOR ALL
USING (
    integration_id IN (
        SELECT id FROM public.performance_marketing_integrations
        WHERE company_id IN (
            SELECT id FROM public.companies WHERE admin_id = auth.uid()
        )
    )
    OR has_role(auth.uid(), 'company'::app_role)
    OR has_role(auth.uid(), 'company_subadmin'::app_role)
);

CREATE POLICY "Users can view campaign connections"
ON public.marketing_campaign_connections FOR SELECT
USING (
    integration_id IN (
        SELECT id FROM public.performance_marketing_integrations
        WHERE company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    )
);

-- Add triggers for updated_at
CREATE TRIGGER update_performance_marketing_integrations_updated_at
BEFORE UPDATE ON public.performance_marketing_integrations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_marketing_campaign_connections_updated_at
BEFORE UPDATE ON public.marketing_campaign_connections
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();