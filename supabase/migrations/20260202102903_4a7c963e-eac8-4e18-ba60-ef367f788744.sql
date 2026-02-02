
-- =============================================
-- FIX: Lead Visibility RLS Policies
-- This migration fixes issues where users cannot see leads assigned to them
-- =============================================

-- 1. Fix the is_in_hierarchy function to be more robust
CREATE OR REPLACE FUNCTION public.is_in_hierarchy(_manager_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_id UUID := _user_id;
  max_depth INTEGER := 20;
  depth INTEGER := 0;
  manager_role app_role;
  manager_company_id UUID;
  user_company_id UUID;
BEGIN
  -- Self check - always in own hierarchy
  IF _manager_id = _user_id THEN
    RETURN TRUE;
  END IF;

  -- Handle NULL inputs
  IF _manager_id IS NULL OR _user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get Company IDs for both users
  SELECT company_id INTO manager_company_id FROM public.profiles WHERE id = _manager_id;
  SELECT company_id INTO user_company_id FROM public.profiles WHERE id = _user_id;

  -- If manager has no company, deny access
  IF manager_company_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- If user's company doesn't match manager's company, deny access
  IF user_company_id IS NOT NULL AND manager_company_id IS DISTINCT FROM user_company_id THEN
    RETURN FALSE;
  END IF;

  -- Company and Company SubAdmin can see everyone IN THEIR COMPANY
  SELECT role INTO manager_role FROM public.user_roles WHERE user_id = _manager_id LIMIT 1;
  IF manager_role IN ('company', 'company_subadmin') THEN
    -- Only if they're in the same company
    IF user_company_id IS NULL OR manager_company_id = user_company_id THEN
      RETURN TRUE;
    END IF;
  END IF;

  -- Standard Hierarchy Check - walk up the chain
  WHILE current_id IS NOT NULL AND depth < max_depth LOOP
    SELECT manager_id INTO current_id
    FROM public.profiles
    WHERE id = current_id;
    
    IF current_id = _manager_id THEN
      RETURN TRUE;
    END IF;
    
    depth := depth + 1;
  END LOOP;
  
  RETURN FALSE;
END;
$$;

-- 2. Create a helper function to check if user belongs to same company
CREATE OR REPLACE FUNCTION public.is_same_company(_user_id uuid, _lead_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id 
    AND company_id = _lead_company_id
  )
$$;

-- 3. Drop and recreate RLS policies for leads table
DROP POLICY IF EXISTS "Users can view their own leads and subordinates' leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads and subordinates' leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create leads" ON public.leads;
DROP POLICY IF EXISTS "Only Super Admin can delete leads" ON public.leads;

-- SELECT: Users can view leads if:
-- 1. They created the lead
-- 2. They are assigned as pre_sales, sales, or post_sales owner
-- 3. They are in hierarchy of creator or sales_owner
-- 4. They are company/subadmin of the lead's company
CREATE POLICY "Users can view leads" 
ON public.leads FOR SELECT 
USING (
  -- Company isolation: must belong to same company
  public.is_same_company(auth.uid(), company_id)
  AND (
    -- Direct ownership
    created_by_id = auth.uid() OR
    pre_sales_owner_id = auth.uid() OR
    sales_owner_id = auth.uid() OR
    post_sales_owner_id = auth.uid() OR
    -- Hierarchy access (manager can see subordinate's leads)
    public.is_in_hierarchy(auth.uid(), COALESCE(sales_owner_id, created_by_id))
  )
);

-- INSERT: Users can create leads in their company
CREATE POLICY "Users can create leads" 
ON public.leads FOR INSERT 
WITH CHECK (
  created_by_id = auth.uid() AND
  public.is_same_company(auth.uid(), company_id)
);

-- UPDATE: Same rules as SELECT
CREATE POLICY "Users can update leads" 
ON public.leads FOR UPDATE 
USING (
  public.is_same_company(auth.uid(), company_id)
  AND (
    created_by_id = auth.uid() OR
    pre_sales_owner_id = auth.uid() OR
    sales_owner_id = auth.uid() OR
    post_sales_owner_id = auth.uid() OR
    public.is_in_hierarchy(auth.uid(), COALESCE(sales_owner_id, created_by_id))
  )
);

-- DELETE: Only company admin can delete
CREATE POLICY "Only Super Admin can delete leads" 
ON public.leads FOR DELETE 
USING (
  public.has_role(auth.uid(), 'company') AND
  public.is_same_company(auth.uid(), company_id)
);

-- 4. Fix RLS policies for leads_real_estate table
DROP POLICY IF EXISTS "Admins view all real estate leads" ON public.leads_real_estate;
DROP POLICY IF EXISTS "Users view own real estate leads" ON public.leads_real_estate;
DROP POLICY IF EXISTS "Users view hierarchy real estate leads" ON public.leads_real_estate;
DROP POLICY IF EXISTS "Users can create real estate leads" ON public.leads_real_estate;
DROP POLICY IF EXISTS "Users can update real estate leads" ON public.leads_real_estate;
DROP POLICY IF EXISTS "Admins can delete real estate leads" ON public.leads_real_estate;

-- SELECT for real estate leads
CREATE POLICY "Users can view real estate leads" 
ON public.leads_real_estate FOR SELECT 
USING (
  public.is_same_company(auth.uid(), company_id)
  AND (
    created_by_id = auth.uid() OR
    pre_sales_owner_id = auth.uid() OR
    sales_owner_id = auth.uid() OR
    post_sales_owner_id = auth.uid() OR
    public.is_in_hierarchy(auth.uid(), COALESCE(sales_owner_id, created_by_id))
  )
);

-- INSERT for real estate leads
CREATE POLICY "Users can create real estate leads" 
ON public.leads_real_estate FOR INSERT 
WITH CHECK (
  created_by_id = auth.uid() AND
  public.is_same_company(auth.uid(), company_id)
);

-- UPDATE for real estate leads
CREATE POLICY "Users can update real estate leads" 
ON public.leads_real_estate FOR UPDATE 
USING (
  public.is_same_company(auth.uid(), company_id)
  AND (
    created_by_id = auth.uid() OR
    pre_sales_owner_id = auth.uid() OR
    sales_owner_id = auth.uid() OR
    post_sales_owner_id = auth.uid() OR
    public.is_in_hierarchy(auth.uid(), COALESCE(sales_owner_id, created_by_id))
  )
);

-- DELETE for real estate leads
CREATE POLICY "Admins can delete real estate leads" 
ON public.leads_real_estate FOR DELETE 
USING (
  (public.has_role(auth.uid(), 'company') OR public.has_role(auth.uid(), 'company_subadmin'))
  AND public.is_same_company(auth.uid(), company_id)
);

-- 5. Fix RLS policies for leads_weskill table  
DROP POLICY IF EXISTS "Admins view all" ON public.leads_weskill;
DROP POLICY IF EXISTS "Users view own" ON public.leads_weskill;
DROP POLICY IF EXISTS "Users view hierarchy" ON public.leads_weskill;
DROP POLICY IF EXISTS "Users can create leads" ON public.leads_weskill;
DROP POLICY IF EXISTS "Users can update leads" ON public.leads_weskill;
DROP POLICY IF EXISTS "Only Super Admin can delete leads" ON public.leads_weskill;

-- SELECT for weskill leads  
CREATE POLICY "Users can view weskill leads" 
ON public.leads_weskill FOR SELECT 
USING (
  public.is_same_company(auth.uid(), company_id)
  AND (
    created_by_id = auth.uid() OR
    pre_sales_owner_id = auth.uid() OR
    sales_owner_id = auth.uid() OR
    post_sales_owner_id = auth.uid() OR
    public.is_in_hierarchy(auth.uid(), COALESCE(sales_owner_id, created_by_id))
  )
);

-- INSERT for weskill leads
CREATE POLICY "Users can create weskill leads" 
ON public.leads_weskill FOR INSERT 
WITH CHECK (
  created_by_id = auth.uid() AND
  public.is_same_company(auth.uid(), company_id)
);

-- UPDATE for weskill leads
CREATE POLICY "Users can update weskill leads" 
ON public.leads_weskill FOR UPDATE 
USING (
  public.is_same_company(auth.uid(), company_id)
  AND (
    created_by_id = auth.uid() OR
    pre_sales_owner_id = auth.uid() OR
    sales_owner_id = auth.uid() OR
    post_sales_owner_id = auth.uid() OR
    public.is_in_hierarchy(auth.uid(), COALESCE(sales_owner_id, created_by_id))
  )
);

-- DELETE for weskill leads  
CREATE POLICY "Admins can delete weskill leads" 
ON public.leads_weskill FOR DELETE 
USING (
  public.has_role(auth.uid(), 'company') AND
  public.is_same_company(auth.uid(), company_id)
);
