-- Add status_type and web_push_enabled to company_lead_statuses
ALTER TABLE public.company_lead_statuses
ADD COLUMN IF NOT EXISTS status_type TEXT DEFAULT 'simple' CHECK (status_type IN ('simple', 'date_derived', 'time_derived')),
ADD COLUMN IF NOT EXISTS web_push_enabled BOOLEAN DEFAULT false;

-- Add reminder_at to public.leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMPTZ;

-- Add reminder_at to public.leads_real_estate (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads_real_estate') THEN
        ALTER TABLE public.leads_real_estate ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add reminder_at to any other custom leads tables (leads_%)
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'leads_%' 
        AND table_name != 'leads' 
        AND table_name != 'leads_real_estate'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMPTZ', t_name);
    END LOOP;
END $$;
