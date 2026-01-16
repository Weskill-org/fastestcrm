-- Add features column to companies table for tracking unlocked add-ons
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}'::jsonb;

-- Example structure: { "custom_slug": true, "custom_domain": true }
