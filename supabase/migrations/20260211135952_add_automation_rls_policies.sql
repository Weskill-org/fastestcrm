-- Add RLS policies for automations table
-- This migration specifically adds the RLS policies that were missing

-- Drop existing policies if any (to ensure clean slate)
DROP POLICY IF EXISTS "Users can view their own automations" ON public.automations;
DROP POLICY IF EXISTS "Users can insert their own automations" ON public.automations;
DROP POLICY IF EXISTS "Users can update their own automations" ON public.automations;
DROP POLICY IF EXISTS "Users can delete their own automations" ON public.automations;
DROP POLICY IF EXISTS "Users can view logs for their own automations" ON public.automation_logs;
DROP POLICY IF EXISTS "System can insert automation logs" ON public.automation_logs;

-- Create policies for automations table
CREATE POLICY "Users can view their own automations"
    ON public.automations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automations"
    ON public.automations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automations"
    ON public.automations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automations"
    ON public.automations FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for automation_logs table
CREATE POLICY "Users can view logs for their own automations"
    ON public.automation_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.automations
            WHERE public.automations.id = public.automation_logs.automation_id
            AND public.automations.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert automation logs"
    ON public.automation_logs FOR INSERT
    WITH CHECK (true);
