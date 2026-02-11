-- Dynamic Automation Triggers for All Lead Tables
-- This migration ensures automation triggers work on ALL lead tables (existing and future)

-- =========================================
-- STEP 1: Create Helper Function
-- =========================================
-- This function can be called to add automation trigger to any lead table
CREATE OR REPLACE FUNCTION public.add_automation_trigger_to_table(table_name text)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Drop existing trigger if any (idempotent)
    EXECUTE format('DROP TRIGGER IF EXISTS trigger_lead_allocation_%I ON public.%I', table_name, table_name);
    
    -- Create new automation trigger
    EXECUTE format('
        CREATE TRIGGER trigger_lead_allocation_%I
        BEFORE INSERT ON public.%I
        FOR EACH ROW
        EXECUTE FUNCTION public.process_new_lead_automation()
    ', table_name, table_name);
    
    RAISE NOTICE 'Added automation trigger to table: %', table_name;
END;
$$;

-- =========================================
-- STEP 2: Apply Triggers to All Existing Lead Tables
-- =========================================
DO $$
DECLARE
    table_record RECORD;
    table_count INTEGER := 0;
BEGIN
    -- Loop through all tables that match 'leads' or 'leads_%' pattern
    FOR table_record IN 
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
          AND (table_name = 'leads' OR table_name LIKE 'leads\_%')
        ORDER BY table_name
    LOOP
        -- Apply trigger to each table
        PERFORM public.add_automation_trigger_to_table(table_record.table_name);
        table_count := table_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Applied automation triggers to % lead tables', table_count;
END;
$$;

-- =========================================
-- STEP 3: Update enable_custom_leads_table() Function
-- =========================================
-- Modify the function to automatically add automation trigger when creating new tables
CREATE OR REPLACE FUNCTION public.enable_custom_leads_table(input_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_company_slug text;
    v_total_licenses int;
    v_new_table_name text;
    v_old_count int;
    v_new_count int;
BEGIN
    -- 1. Get Company Details
    SELECT slug, total_licenses INTO v_company_slug, v_total_licenses
    FROM public.companies
    WHERE id = input_company_id;

    IF v_company_slug IS NULL THEN
        RAISE EXCEPTION 'Company not found';
    END IF;

    -- 2. Verify License Requirement
    IF v_total_licenses < 2 THEN
        RAISE EXCEPTION 'Company does not meet license requirements (Minimum 2)';
    END IF;

    -- 3. Define New Table Name (leads_slug)
    v_new_table_name := 'leads_' || regexp_replace(v_company_slug, '[^a-zA-Z0-9_]', '_', 'g');

    -- Check if table already exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = v_new_table_name
    ) THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Custom table already exists', 
            'table_name', v_new_table_name
        );
    END IF;

    -- 4. Create New Table (Like leads)
    EXECUTE format('CREATE TABLE public.%I (LIKE public.leads INCLUDING ALL)', v_new_table_name);

    -- 5. Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_new_table_name);

    -- 6. Recreate Policies
    EXECUTE format('
        CREATE POLICY "Users can view their own leads and subordinates'' leads" 
        ON public.%I FOR SELECT 
        USING (
            auth.uid() = sales_owner_id 
            OR 
            is_in_hierarchy(auth.uid(), sales_owner_id)
        )', v_new_table_name);

    EXECUTE format('
        CREATE POLICY "Users can create leads" 
        ON public.%I FOR INSERT 
        WITH CHECK (
            auth.uid() = created_by_id
        )', v_new_table_name);

    EXECUTE format('
        CREATE POLICY "Users can update their own leads and subordinates'' leads" 
        ON public.%I FOR UPDATE 
        USING (
            auth.uid() = sales_owner_id 
            OR 
            is_in_hierarchy(auth.uid(), sales_owner_id)
        )', v_new_table_name);

    EXECUTE format('
        CREATE POLICY "Only Super Admin can delete leads" 
        ON public.%I FOR DELETE 
        USING (
            has_role(auth.uid(), ''company''::app_role)
        )', v_new_table_name);

    -- 7. Recreate Triggers
    -- Update Timestamp
    EXECUTE format('
        CREATE TRIGGER update_leads_updated_at 
        BEFORE UPDATE ON public.%I 
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()
    ', v_new_table_name);

    -- Lead Source from Link
    EXECUTE format('
        CREATE TRIGGER set_lead_source_from_link 
        BEFORE INSERT OR UPDATE ON public.%I 
        FOR EACH ROW EXECUTE FUNCTION public.handle_lead_source_from_link()
    ', v_new_table_name);

    -- *** NEW: Add Automation Trigger ***
    PERFORM public.add_automation_trigger_to_table(v_new_table_name);

    -- 8. Migrate Data
    EXECUTE format('
        INSERT INTO public.%I 
        SELECT * FROM public.leads 
        WHERE company_id = %L
    ', v_new_table_name, input_company_id);

    GET DIAGNOSTICS v_new_count = ROW_COUNT;

    -- 9. Delete Old Data
    DELETE FROM public.leads WHERE company_id = input_company_id;
    GET DIAGNOSTICS v_old_count = ROW_COUNT;

    -- 10. Update Company Record
    UPDATE public.companies 
    SET custom_leads_table = v_new_table_name 
    WHERE id = input_company_id;

    RETURN jsonb_build_object(
        'success', true,
        'table_name', v_new_table_name,
        'leads_migrated', v_new_count,
        'leads_deleted_from_main', v_old_count
    );
END;
$$;
