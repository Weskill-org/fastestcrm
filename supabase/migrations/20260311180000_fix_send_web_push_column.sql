-- Direct ALTER TABLE statements since the DO $$ block didn't work
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS send_web_push BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.leads_weskill ADD COLUMN IF NOT EXISTS send_web_push BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.leads_real_estate ADD COLUMN IF NOT EXISTS send_web_push BOOLEAN NOT NULL DEFAULT FALSE;
