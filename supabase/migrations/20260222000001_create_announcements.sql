-- ─────────────────────────────────────────────────────────────────────────────
-- Announcements system
-- ─────────────────────────────────────────────────────────────────────────────

-- Type enum for announcement visual style
DO $$ BEGIN
  CREATE TYPE announcement_type AS ENUM ('info', 'warning', 'success', 'maintenance');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Type enum for targeting mode
DO $$ BEGIN
  CREATE TYPE announcement_target_type AS ENUM ('all', 'specific_companies', 'subscription_status');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Main announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id                           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title                        TEXT         NOT NULL,
  body                         TEXT         NOT NULL,
  type                         TEXT         NOT NULL DEFAULT 'info'
                                            CHECK (type IN ('info','warning','success','maintenance')),
  target_type                  TEXT         NOT NULL DEFAULT 'all'
                                            CHECK (target_type IN ('all','specific_companies','subscription_status')),
  target_company_ids           UUID[]       DEFAULT NULL,
  target_subscription_statuses TEXT[]       DEFAULT NULL,
  scheduled_at                 TIMESTAMPTZ  DEFAULT NULL,   -- NULL = live immediately
  is_active                    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_by                   UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at                   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Read-tracking per user (enables per-user dismiss)
CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID         NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id         UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);

-- Index for fast lookup of unread announcements per user
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user
  ON public.announcement_reads(user_id, announcement_id);

CREATE INDEX IF NOT EXISTS idx_announcements_active_scheduled
  ON public.announcements(is_active, scheduled_at);

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE public.announcements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- Company users can read announcements relevant to their company
DROP POLICY IF EXISTS "Users see relevant live announcements" ON public.announcements;
CREATE POLICY "Users see relevant live announcements" ON public.announcements
FOR SELECT USING (
  is_active = TRUE
  AND (scheduled_at IS NULL OR scheduled_at <= NOW())
  AND (
    -- All companies broadcast
    target_type = 'all'

    -- Specific companies list
    OR (
      target_type = 'specific_companies'
      AND (
        SELECT company_id FROM public.profiles
        WHERE id = auth.uid()
        LIMIT 1
      ) = ANY(target_company_ids)
    )

    -- By subscription status
    OR (
      target_type = 'subscription_status'
      AND (
        SELECT c.subscription_status
        FROM public.profiles p
        JOIN public.companies c ON c.id = p.company_id
        WHERE p.id = auth.uid()
        LIMIT 1
      ) = ANY(target_subscription_statuses)
    )
  )
);

-- Users can see and create their own reads (for dismiss tracking)
DROP POLICY IF EXISTS "Users manage own reads" ON public.announcement_reads;
CREATE POLICY "Users manage own reads" ON public.announcement_reads
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
