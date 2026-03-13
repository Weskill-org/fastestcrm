-- Add deactivation support to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_deactivated BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

-- Index for quick lookups (e.g. login guard)
CREATE INDEX IF NOT EXISTS idx_profiles_is_deactivated
  ON public.profiles (is_deactivated)
  WHERE is_deactivated = true;
