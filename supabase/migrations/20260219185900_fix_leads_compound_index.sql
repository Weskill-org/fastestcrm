-- Add compound index on leads table for the most common query pattern:
-- Filter by company_id + ORDER BY created_at DESC, id DESC
-- This mirrors the index already on leads_real_estate (idx_leads_re_company_created)
-- and prevents full table scans as lead count grows.

CREATE INDEX IF NOT EXISTS idx_leads_company_created_at
ON public.leads (company_id, created_at DESC, id DESC);
