-- Indexes for leads table
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON public.leads (company_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_by_id ON public.leads (created_by_id);
CREATE INDEX IF NOT EXISTS idx_leads_sales_owner_id ON public.leads (sales_owner_id);

-- Indexes for leads_real_estate table
CREATE INDEX IF NOT EXISTS idx_leads_real_estate_company_id ON public.leads_real_estate (company_id);
CREATE INDEX IF NOT EXISTS idx_leads_real_estate_created_by_id ON public.leads_real_estate (created_by_id);
CREATE INDEX IF NOT EXISTS idx_leads_real_estate_sales_owner_id ON public.leads_real_estate (sales_owner_id);
