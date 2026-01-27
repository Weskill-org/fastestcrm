-- Add industry column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS industry text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS industry_locked boolean DEFAULT false;

-- Add a comment for documentation
COMMENT ON COLUMN public.companies.industry IS 'The CRM industry type (education, real_estate, healthcare, etc.). Once set, requires payment to change.';
COMMENT ON COLUMN public.companies.industry_locked IS 'When true, changing industry requires payment (Rs. 10,000)';