-- Create features_unlocked table to track premium feature purchases
CREATE TABLE IF NOT EXISTS public.features_unlocked (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT now(),
    unlocked_by UUID REFERENCES public.profiles(id),
    UNIQUE(company_id, feature_name)
);

-- Enable RLS
ALTER TABLE public.features_unlocked ENABLE ROW LEVEL SECURITY;

-- Policy: Companies can view their own unlocked features
CREATE POLICY "Companies can view their own unlocked features"
    ON public.features_unlocked FOR SELECT
    USING (
        company_id IN (
            SELECT company_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Policy: Service role can insert (for Edge Functions)
CREATE POLICY "Service role can insert features"
    ON public.features_unlocked FOR INSERT
    WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_features_unlocked_company_feature 
    ON public.features_unlocked(company_id, feature_name);
