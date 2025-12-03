-- Create enum for 12-level user hierarchy
CREATE TYPE public.app_role AS ENUM (
  'company',
  'company_subadmin',
  'cbo',
  'vp',
  'avp',
  'dgm',
  'agm',
  'sm',
  'tl',
  'bde',
  'intern',
  'ca'
);

-- Create enum for lead status
CREATE TYPE public.lead_status AS ENUM (
  'new',
  'interested',
  'not_interested',
  'follow_up',
  'rnr',
  'dnd',
  'paid'
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  manager_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'bde',
  UNIQUE (user_id, role)
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Personal info
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  college TEXT,
  graduating_year INTEGER,
  branch TEXT,
  domain TEXT,
  cgpa DECIMAL(3,2),
  state TEXT,
  preferred_language TEXT,
  company TEXT,
  -- Ownership
  ca_name TEXT,
  pre_sales_owner_id UUID REFERENCES public.profiles(id),
  sales_owner_id UUID REFERENCES public.profiles(id),
  post_sales_owner_id UUID REFERENCES public.profiles(id),
  created_by_id UUID REFERENCES public.profiles(id) NOT NULL,
  -- Status and financials
  status lead_status NOT NULL DEFAULT 'new',
  revenue_received DECIMAL(12,2) DEFAULT 0,
  revenue_projected DECIMAL(12,2) DEFAULT 0,
  total_recovered DECIMAL(12,2) DEFAULT 0,
  product_purchased TEXT,
  batch_month TEXT,
  payment_link TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Function to check if user is in hierarchy (for RLS)
CREATE OR REPLACE FUNCTION public.is_in_hierarchy(_manager_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_id UUID := _user_id;
  max_depth INTEGER := 15;
  depth INTEGER := 0;
BEGIN
  IF _manager_id = _user_id THEN
    RETURN TRUE;
  END IF;
  
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

-- Profiles RLS policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view profiles in their hierarchy"
  ON public.profiles FOR SELECT
  USING (public.is_in_hierarchy(auth.uid(), id));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- User roles RLS policies
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (
    public.has_role(auth.uid(), 'company') OR
    public.has_role(auth.uid(), 'company_subadmin')
  );

-- Leads RLS policies
CREATE POLICY "Users can view leads they created"
  ON public.leads FOR SELECT
  USING (created_by_id = auth.uid());

CREATE POLICY "Users can view leads they own"
  ON public.leads FOR SELECT
  USING (
    pre_sales_owner_id = auth.uid() OR
    sales_owner_id = auth.uid() OR
    post_sales_owner_id = auth.uid()
  );

CREATE POLICY "Users can view leads from hierarchy"
  ON public.leads FOR SELECT
  USING (public.is_in_hierarchy(auth.uid(), created_by_id));

CREATE POLICY "Users can create leads"
  ON public.leads FOR INSERT
  WITH CHECK (created_by_id = auth.uid());

CREATE POLICY "Users can update their leads"
  ON public.leads FOR UPDATE
  USING (
    created_by_id = auth.uid() OR
    pre_sales_owner_id = auth.uid() OR
    sales_owner_id = auth.uid() OR
    post_sales_owner_id = auth.uid() OR
    public.is_in_hierarchy(auth.uid(), created_by_id)
  );

-- Trigger function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  -- Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'bde');
  
  RETURN NEW;
END;
$$;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();