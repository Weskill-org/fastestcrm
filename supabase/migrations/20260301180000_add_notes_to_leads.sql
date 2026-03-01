-- Add notes column to public.leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add notes to any other custom leads tables (leads_%) that might be missing it
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
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS notes TEXT', t_name);
    END LOOP;
END $$;
