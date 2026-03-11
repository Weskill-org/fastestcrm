-- Add send_web_push flag to ALL lead tables so the process-reminders
-- function knows whether to fire a push notification for due reminders.
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND (tablename = 'leads' OR tablename LIKE 'leads_%')
    LOOP
        EXECUTE format(
            'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS send_web_push BOOLEAN NOT NULL DEFAULT FALSE;',
            table_record.tablename
        );
    END LOOP;
END $$;
