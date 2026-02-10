-- Add lead_history column to leads_real_estate table
ALTER TABLE "public"."leads_real_estate" 
ADD COLUMN IF NOT EXISTS "lead_history" jsonb DEFAULT '[]'::jsonb;

-- Create trigger for leads_real_estate
-- We can reuse the same function if it's generic enough, but the function we wrote 
-- for 'leads' might return NEW of type 'leads'. PL/pgSQL functions returning TRIGGER 
-- are associated with the table they are triggered on, so 'NEW' takes the shape of that table.
-- As long as both have 'status' and 'lead_history', it should work.
-- But to be safe and clear, let's reuse the function `handle_lead_update_history` 
-- assuming it doesn't reference any column NOT present in leads_real_estate.
-- The function uses: status, lead_history. Both tables have these.

DROP TRIGGER IF EXISTS "on_lead_real_estate_update_history" ON "public"."leads_real_estate";

CREATE TRIGGER "on_lead_real_estate_update_history"
BEFORE UPDATE ON "public"."leads_real_estate"
FOR EACH ROW
EXECUTE FUNCTION "public"."handle_lead_update_history"();
