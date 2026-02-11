
-- Ensure automations table exists (recovery for missing migration)
CREATE TABLE IF NOT EXISTS public.automations (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null references auth.users(id),
    name text not null,
    trigger_type text not null,
    trigger_config jsonb default '{}'::jsonb,
    action_type text not null,
    action_config jsonb default '{}'::jsonb,
    is_active boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    constraint automations_pkey primary key (id)
);

CREATE TABLE IF NOT EXISTS public.automation_logs (
    id uuid not null default gen_random_uuid(),
    automation_id uuid not null references public.automations(id) on delete cascade,
    status text not null,
    logs text,
    created_at timestamp with time zone default now(),
    constraint automation_logs_pkey primary key (id)
);

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- 1. Add company_id and distribution logic support to automations
ALTER TABLE public.automations 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_automations_company_id ON public.automations(company_id);

-- 2. Create table to track Round Robin state
CREATE TABLE IF NOT EXISTS public.automation_states (
    automation_id UUID PRIMARY KEY REFERENCES public.automations(id) ON DELETE CASCADE,
    last_index INTEGER DEFAULT -1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on automation_states
ALTER TABLE public.automation_states ENABLE ROW LEVEL SECURITY;

-- 3. Function to process lead allocation
CREATE OR REPLACE FUNCTION public.process_new_lead_automation()
RETURNS TRIGGER AS $$
DECLARE
    auto_record RECORD;
    action_config JSONB;
    strategy TEXT;
    target_users JSONB;
    user_ids TEXT[];
    selected_user_id UUID;
    user_count INTEGER;
    next_index INTEGER;
    current_state_index INTEGER;
    should_run BOOLEAN;
BEGIN
    -- Loop through active automations for this company
    FOR auto_record IN 
        SELECT id, trigger_type, trigger_config, action_config 
        FROM public.automations 
        WHERE company_id = NEW.company_id 
          AND is_active = true 
          AND action_type = 'assign_lead'
    LOOP
        -- Check if Automation should run
        should_run := false;
        
        IF auto_record.trigger_type = 'lead_created' THEN
            should_run := true;
        ELSIF auto_record.trigger_type = 'form_submitted' THEN
            -- Check if form_id matches
            -- NEW.form_id is a UUID, trigger_config->>'form_id' is text. Cast if needed.
            IF NEW.form_id::text = (auto_record.trigger_config->>'form_id') THEN
                should_run := true;
            END IF;
        END IF;

        -- Check Conditions (if any)
        IF should_run = true AND (auto_record.trigger_config ? 'conditions') THEN
            DECLARE
                conditions jsonb := auto_record.trigger_config->'conditions';
                condition jsonb;
                field text;
                op text;
                val text;
                field_val text;
                condition_met boolean := true;
            BEGIN
                FOR condition IN SELECT * FROM jsonb_array_elements(conditions)
                LOOP
                    field := condition->>'field';
                    op := condition->>'operator';
                    val := condition->>'value';
                    
                    -- Try to get value from main table columns
                    BEGIN
                        EXECUTE format('SELECT ($1).%I::text', field) USING NEW INTO field_val;
                    EXCEPTION WHEN OTHERS THEN
                        field_val := NULL;
                    END;
                    
                    -- If null, check lead_profile (custom fields)
                    IF field_val IS NULL AND NEW.lead_profile IS NOT NULL THEN
                            field_val := NEW.lead_profile->>field;
                    END IF;
                    
                    -- Compare
                    IF field_val IS NULL THEN field_val := ''; END IF;
                    
                    IF op = 'equals' AND field_val != val THEN condition_met := false;
                    ELSIF op = 'not_equals' AND field_val = val THEN condition_met := false;
                    ELSIF op = 'contains' AND position(val in field_val) = 0 THEN condition_met := false;
                    ELSIF op = 'greater_than' AND field_val <= val THEN condition_met := false;
                    ELSIF op = 'less_than' AND field_val >= val THEN condition_met := false;
                    END IF;
                    
                    EXIT WHEN condition_met = false;
                END LOOP;
                should_run := condition_met;
            END;
        END IF;

        IF should_run = true THEN
            action_config := auto_record.action_config;
            strategy := action_config->>'distribution_logic';
            target_users := action_config->'target_users';
            
            SELECT ARRAY_AGG(x::text) INTO user_ids 
            FROM jsonb_array_elements_text(target_users) t(x);
            
            user_count := array_length(user_ids, 1);
            
            IF user_count > 0 THEN
                IF strategy = 'random' THEN
                    selected_user_id := user_ids[floor(random() * user_count + 1)::int]::uuid;
                ELSIF strategy = 'round_robin' THEN
                    INSERT INTO public.automation_states (automation_id, last_index)
                    VALUES (auto_record.id, -1)
                    ON CONFLICT (automation_id) DO NOTHING;
                    
                    SELECT last_index INTO current_state_index 
                    FROM public.automation_states 
                    WHERE automation_id = auto_record.id 
                    FOR UPDATE;
                    
                    next_index := (current_state_index + 1) % user_count;
                    selected_user_id := user_ids[next_index + 1]::uuid;
                    
                    UPDATE public.automation_states 
                    SET last_index = next_index, updated_at = NOW() 
                    WHERE automation_id = auto_record.id;
                END IF;

                NEW.sales_owner_id := selected_user_id;
                
                    INSERT INTO public.automation_logs (automation_id, status, logs)
                    VALUES (auto_record.id, 'success', 'Assigned to user: ' || selected_user_id);
                    
            END IF;
            
            EXIT; 
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create Triggers (BEFORE INSERT)
-- We use BEFORE INSERT so we can set the sales_owner_id before the row is written.
-- This prevents a "null owner" flash and saves a DB write.

DROP TRIGGER IF EXISTS trigger_lead_allocation_leads ON public.leads;
CREATE TRIGGER trigger_lead_allocation_leads
BEFORE INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.process_new_lead_automation();

DROP TRIGGER IF EXISTS trigger_lead_allocation_leads_re ON public.leads_real_estate;
CREATE TRIGGER trigger_lead_allocation_leads_re
BEFORE INSERT ON public.leads_real_estate
FOR EACH ROW
EXECUTE FUNCTION public.process_new_lead_automation();

