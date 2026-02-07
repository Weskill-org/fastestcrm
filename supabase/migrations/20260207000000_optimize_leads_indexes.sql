-- Add indexes to leads_real_estate table for faster filtering and sorting

-- 1. Compound index for company_id + created_at (Most common access pattern: Get latest leads for a company)
CREATE INDEX IF NOT EXISTS idx_leads_re_company_created 
ON public.leads_real_estate (company_id, created_at DESC);

-- 2. Indexes for owner columns (Used in hierarchy filtering) - using Hash index might be enough for equality check but B-tree is safer for joins
CREATE INDEX IF NOT EXISTS idx_leads_re_sales_owner 
ON public.leads_real_estate (sales_owner_id);

CREATE INDEX IF NOT EXISTS idx_leads_re_pre_sales_owner 
ON public.leads_real_estate (pre_sales_owner_id);

CREATE INDEX IF NOT EXISTS idx_leads_re_post_sales_owner 
ON public.leads_real_estate (post_sales_owner_id);

-- 3. Index for Status filtering
CREATE INDEX IF NOT EXISTS idx_leads_re_status 
ON public.leads_real_estate (status);

-- 4. GIN Index for Search (Name, Email, Phone) - if not already using Full Text Search
-- For ILIKE operations, we generally need pg_trgm extension and GIN indexes, 
-- but ensuring at least standard indexes exist can help if we switch to exact match or prefix search.
-- Simple B-tree on email/phone helps slightly.
CREATE INDEX IF NOT EXISTS idx_leads_re_phone 
ON public.leads_real_estate (phone);

CREATE INDEX IF NOT EXISTS idx_leads_re_email 
ON public.leads_real_estate (email);
