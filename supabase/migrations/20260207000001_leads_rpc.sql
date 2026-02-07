-- Function to get all accessible team IDs for a user (Self + Descendants)
CREATE OR REPLACE FUNCTION public.get_accessible_team_ids(input_user_id uuid)
RETURNS uuid[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_role app_role;
    v_company_id uuid;
    v_team_ids uuid[];
BEGIN
    -- 1. Get User Role & Company
    SELECT role, company_id INTO v_role, v_company_id
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = input_user_id;

    -- 2. If Admin, return NULL (indicates "All Access")
    IF v_role IN ('platform_admin', 'company', 'company_subadmin') THEN
        RETURN NULL;
    END IF;

    -- 3. Recursive CTE to find descendants
    WITH RECURSIVE team_tree AS (
        -- Base case: Self
        SELECT id, manager_id
        FROM public.profiles
        WHERE id = input_user_id
        
        UNION ALL
        
        -- Recursive case: Direct reports
        SELECT p.id, p.manager_id
        FROM public.profiles p
        INNER JOIN team_tree t ON p.manager_id = t.id
    )
    SELECT array_agg(id) INTO v_team_ids FROM team_tree;

    RETURN v_team_ids;
END;
$$;

-- RPC Function to fetch Real Estate Leads with robust backend filtering
CREATE OR REPLACE FUNCTION public.get_real_estate_leads(
    page int DEFAULT 1,
    page_size int DEFAULT 25,
    search_query text DEFAULT NULL,
    status_filter text DEFAULT NULL,
    owner_filter uuid[] DEFAULT NULL,
    property_type_filter text[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_company_id uuid;
    v_accessible_ids uuid[];
    v_offset int;
    v_result jsonb;
    v_total_count int;
BEGIN
    -- 1. Get User's Company
    SELECT company_id INTO v_company_id
    FROM public.profiles
    WHERE id = v_user_id;

    IF v_company_id IS NULL THEN
        RETURN jsonb_build_object('leads', '[]'::jsonb, 'count', 0);
    END IF;

    -- 2. Get Accessible IDs (Hierarchy)
    v_accessible_ids := public.get_accessible_team_ids(v_user_id);

    -- 3. Calculate Pagination
    v_offset := (page - 1) * page_size;

    -- 4. Execute Query with filters
    -- We use dynamic SQL or a complex query. Here, a complex query with minimal dynamic parts is safer.
    -- However, to handle optional filters cleanly, we can use a CTE.
    
    WITH filtered_leads AS (
        SELECT 
            l.*,
            -- Join profile names
            p1.full_name as pre_sales_owner_name,
            p2.full_name as sales_owner_name,
            p3.full_name as post_sales_owner_name
        FROM public.leads_real_estate l
        LEFT JOIN public.profiles p1 ON l.pre_sales_owner_id = p1.id
        LEFT JOIN public.profiles p2 ON l.sales_owner_id = p2.id
        LEFT JOIN public.profiles p3 ON l.post_sales_owner_id = p3.id
        WHERE 
            l.company_id = v_company_id
            AND
            (
                -- Hierarchy Check: If v_accessible_ids is NULL, skip check (Admin). 
                -- If NOT NULL, must match any owner.
                v_accessible_ids IS NULL 
                OR 
                (
                    l.sales_owner_id = ANY(v_accessible_ids) OR
                    l.pre_sales_owner_id = ANY(v_accessible_ids) OR
                    l.post_sales_owner_id = ANY(v_accessible_ids)
                )
            )
            AND
            (
                -- Search Filter
                search_query IS NULL OR 
                (
                    l.name ILIKE '%' || search_query || '%' OR
                    l.email ILIKE '%' || search_query || '%' OR
                    l.phone ILIKE '%' || search_query || '%' OR
                    l.property_name ILIKE '%' || search_query || '%' OR
                    l.preferred_location ILIKE '%' || search_query || '%'
                )
            )
            AND
            (
                -- Status Filter
                status_filter IS NULL OR l.status = status_filter
            )
            AND
            (
                -- Owner Filter (Specific UI selection)
                owner_filter IS NULL OR 
                (
                    l.sales_owner_id = ANY(owner_filter) OR
                    l.pre_sales_owner_id = ANY(owner_filter) OR
                    l.post_sales_owner_id = ANY(owner_filter)
                )
            )
             AND
            (
                -- Property Type Filter
                property_type_filter IS NULL OR l.property_type = ANY(property_type_filter)
            )
    ),
    total AS (
        SELECT COUNT(*) as count FROM filtered_leads
    )
    SELECT jsonb_build_object(
        'leads', COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', fl.id,
                'name', fl.name,
                'phone', fl.phone,
                'email', fl.email,
                'status', fl.status,
                'property_type', fl.property_type,
                'budget_min', fl.budget_min,
                'budget_max', fl.budget_max,
                'preferred_location', fl.preferred_location,
                'created_at', fl.created_at,
                'sales_owner_id', fl.sales_owner_id,
                'pre_sales_owner', jsonb_build_object('full_name', fl.pre_sales_owner_name),
                'sales_owner', jsonb_build_object('full_name', fl.sales_owner_name),
                'post_sales_owner', jsonb_build_object('full_name', fl.post_sales_owner_name)
            ) ORDER BY fl.created_at DESC
        ), '[]'::jsonb),
        'count', (SELECT count FROM total)
    ) INTO v_result
    FROM (
        SELECT * FROM filtered_leads
        ORDER BY created_at DESC
        LIMIT page_size OFFSET v_offset
    ) fl;

    RETURN v_result;
END;
$$;
