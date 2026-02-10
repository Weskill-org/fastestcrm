-- Add lead_history column to leads table
ALTER TABLE "public"."leads" 
ADD COLUMN IF NOT EXISTS "lead_history" jsonb DEFAULT '[]'::jsonb;

-- Function to handle lead history updates
CREATE OR REPLACE FUNCTION "public"."handle_lead_update_history"() 
RETURNS trigger AS $$
DECLARE
    user_name text;
    history_entry jsonb;
    old_status text;
    new_status text;
BEGIN
    -- Get the name of the user making the change
    -- We try to get it from the profiles table using auth.uid()
    -- If not found (e.g. system update), default to 'System' or 'Unknown'
    
    -- Check if status has changed
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        SELECT full_name INTO user_name 
        FROM public.profiles 
        WHERE id = auth.uid();

        IF user_name IS NULL THEN
            user_name := 'System';
        END IF;

        old_status := OLD.status;
        new_status := NEW.status;

        -- Create history entry
        -- Format: {{Name}} at {{Date and Time}} changed lead status from ____ to ____
        history_entry := jsonb_build_object(
            'action', 'status_change',
            'details', format('%s at %s changed lead status from %s to %s', 
                              user_name, 
                              to_char(now(), 'YYYY-MM-DD HH24:MI:SS'), 
                              COALESCE(old_status, 'New'), 
                              COALESCE(new_status, 'Unknown')),
            'timestamp', now(),
            'user_name', user_name,
            'old_status', old_status,
            'new_status', new_status
        );

        -- Append to history (prepend to array for newer first)
        -- Using || operator to append. To prepend, we'd need jsonb_insert or similar.
        -- Let's just append and handle sorting in frontend or use jsonb_insert to prepend.
        -- Prepend:
        NEW.lead_history := jsonb_build_array(history_entry) || COALESCE(OLD.lead_history, '[]'::jsonb);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS "on_lead_update_history" ON "public"."leads";
CREATE TRIGGER "on_lead_update_history"
BEFORE UPDATE ON "public"."leads"
FOR EACH ROW
EXECUTE FUNCTION "public"."handle_lead_update_history"();
